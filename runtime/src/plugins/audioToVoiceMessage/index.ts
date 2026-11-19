import { getChannelStore } from '../../metro/common.js';
import { findByProps, waitFor } from '../../metro/index.js';
import { pushNotification } from '../../notifications/index.js';
import { before, type Unpatch } from '../../patcher/index.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const IS_VOICE_MESSAGE_FLAG = 8192;
const PENDING_TTL_MS = 30000;
const ATTACHMENTS_POST_RE = /^\/?channels\/(\d+)\/attachments(?:$|\?)/;
const MESSAGES_POST_RE = /^\/?channels\/(\d+)\/messages(?:$|\?)/;
const AUDIO_EXT_RE = /\.(ogg|opus|mp3|m4a|wav|aac|flac|webm|amr|3gp)(?:\?.*)?$/i;
const VOICE_KEYWORD_RE = /(?:^|\s)(?:\/voice|!vm)(?=\s|$)/i;
const VOICE_KEYWORD_GLOBAL_RE = /(?:^|\s)(?:\/voice|!vm)(?=\s|$)/gi;
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

type WaveformStyle = 'natural' | 'wave' | 'bars' | 'flat';

interface PendingAudioInfo {
  timestamp: number;
  origName: string;
  size: number;
  durationSecs: number | null;
  hasTriggerKeyword: boolean;
  hadCaption: boolean;
  renamedToOgg: boolean;
}

const settings = definePluginSettings({
  triggerMode: {
    type: OptionType.SELECT,
    label: 'When to Convert',
    description: 'Choose whether single audio uploads convert automatically or only with a trigger word.',
    default: 'auto',
    options: [
      { label: 'Automatic (any single audio file)', value: 'auto' },
      { label: 'Only when typing /voice or !vm', value: 'keyword' },
    ],
  },
  waveformStyle: {
    type: OptionType.SELECT,
    label: 'Waveform Style',
    description: 'Visual wave shape displayed inside the voice message player.',
    default: 'natural',
    options: [
      { label: 'Natural Speech', value: 'natural' },
      { label: 'Smooth Wave', value: 'wave' },
      { label: 'Equalizer Bars', value: 'bars' },
      { label: 'Flat Line', value: 'flat' },
    ],
  },
  renameToOgg: {
    type: OptionType.BOOLEAN,
    label: 'Use .ogg Filename',
    description: 'Rename uploaded audio files to voice-message.ogg so Discord plays them cleanly.',
    default: true,
  },
  customDurationSecs: {
    type: OptionType.NUMBER,
    label: 'Custom Length (Seconds)',
    description: 'Optional voice message duration in seconds. Leave at 0 to estimate automatically.',
    min: 0,
    max: 1200,
    default: 0,
  },
  clearCaptionOnAuto: {
    type: OptionType.BOOLEAN,
    label: 'Convert Even With Message Text',
    description: 'In automatic mode, convert audio files even if you wrote text alongside them.',
    default: false,
  },
});

const pendingByChannel = new Map<string, PendingAudioInfo>();
const cleanups: Array<() => void> = [];
let patchedModules = new WeakMap<object, Set<string>>();
let convertedTotal = 0;

function markPatched(target: object, key: string): boolean {
  let keys = patchedModules.get(target);
  if (!keys) {
    keys = new Set<string>();
    patchedModules.set(target, keys);
  }
  if (keys.has(key)) {
    return false;
  }
  keys.add(key);
  return true;
}

function bytesToBase64(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] & 255;
    const hasB = i + 1 < bytes.length;
    const hasC = i + 2 < bytes.length;
    const b = hasB ? bytes[i + 1] & 255 : 0;
    const c = hasC ? bytes[i + 2] & 255 : 0;
    const triple = (a << 16) | (b << 8) | c;
    out += B64_CHARS[(triple >> 18) & 63];
    out += B64_CHARS[(triple >> 12) & 63];
    out += hasB ? B64_CHARS[(triple >> 6) & 63] : '=';
    out += hasC ? B64_CHARS[triple & 63] : '=';
  }
  return out;
}

function generateWaveformBase64(style: string, seedInput: string): string {
  let seed = 2166136261;
  for (let i = 0; i < seedInput.length; i += 1) {
    seed ^= seedInput.charCodeAt(i);
    seed = Math.imul(seed, 16777619) >>> 0;
  }
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const len = 64;
  const samples: number[] = [];
  for (let i = 0; i < len; i += 1) {
    let amp = 96;
    if (style === 'flat') {
      amp = 92;
    } else if (style === 'wave') {
      const wave = 0.5 + 0.45 * Math.sin((i / len) * Math.PI * 5);
      amp = Math.round(35 + wave * 195);
    } else if (style === 'bars') {
      amp = i % 2 === 0 ? Math.round(135 + nextRand() * 110) : Math.round(40 + nextRand() * 65);
    } else {
      const envelope = Math.sin((i / (len - 1)) * Math.PI);
      const speechDip = nextRand() < 0.18 ? 0.25 : 0.65 + nextRand() * 0.35;
      amp = Math.round(28 + envelope * speechDip * 215);
    }
    samples.push(Math.max(8, Math.min(255, amp)));
  }
  return bytesToBase64(samples);
}

function isAudioCandidate(file: any): boolean {
  if (!file || typeof file !== 'object') {
    return false;
  }
  const mime = typeof file.mimeType === 'string'
    ? file.mimeType
    : typeof file.type === 'string'
      ? file.type
      : typeof file.content_type === 'string'
        ? file.content_type
        : '';
  if (/^audio\//i.test(mime)) {
    return true;
  }
  const name =
    file.filename ?? file.name ?? file.uploaded_filename ?? file.uri ?? file.item?.filename ?? '';
  return typeof name === 'string' && AUDIO_EXT_RE.test(name.trim());
}

function estimateDurationFromSize(filename: string, sizeBytes: number): number {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return 5;
  }
  const lower = filename.toLowerCase();
  let bytesPerSec = 16000;
  if (lower.endsWith('.ogg') || lower.endsWith('.opus')) {
    bytesPerSec = 6000;
  } else if (lower.endsWith('.wav')) {
    bytesPerSec = 176400;
  } else if (lower.endsWith('.flac')) {
    bytesPerSec = 90000;
  } else if (lower.endsWith('.amr') || lower.endsWith('.3gp')) {
    bytesPerSec = 3200;
  }
  const raw = Math.round((sizeBytes / bytesPerSec) * 10) / 10;
  return Math.max(1, Math.min(1200, raw));
}

function extractRawDurationSecs(file: any): number | null {
  const candidates = [
    file?.durationSecs,
    file?.duration_secs,
    file?.duration,
    file?.item?.durationSecs,
    file?.item?.durationMs,
    file?.clip?.duration,
  ];
  for (let i = 0; i < candidates.length; i += 1) {
    const val = Number(candidates[i]);
    if (Number.isFinite(val) && val > 0) {
      const secs = val > 3600 ? val / 1000 : val;
      return Math.round(Math.max(0.5, Math.min(1200, secs)) * 10) / 10;
    }
  }
  return null;
}

function stripVoiceKeywords(raw: unknown): { cleaned: string; hadKeyword: boolean } {
  if (typeof raw !== 'string') {
    return { cleaned: '', hadKeyword: false };
  }
  const hadKeyword = VOICE_KEYWORD_RE.test(raw);
  const cleaned = raw.replace(VOICE_KEYWORD_GLOBAL_RE, ' ').trim();
  return { cleaned, hadKeyword };
}

function getFreshPending(channelId: string): PendingAudioInfo | null {
  const entry = pendingByChannel.get(channelId);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > PENDING_TTL_MS) {
    pendingByChannel.delete(channelId);
    return null;
  }
  return entry;
}

function handleUploadFilesBefore(opts: any): void {
  if (!opts || typeof opts !== 'object' || !Array.isArray(opts.files) || opts.files.length !== 1) {
    return;
  }
  const file = opts.files[0];
  if (!isAudioCandidate(file)) {
    return;
  }
  const channelId = String(opts.channelId ?? '');
  if (!channelId) {
    return;
  }
  const origName = String(file.filename ?? file.name ?? file.item?.filename ?? 'audio.ogg');
  const size = Number(file.size ?? file.item?.size ?? 0) || 0;
  const durationSecs = extractRawDurationSecs(file);
  const msgObj = opts.parsedMessage;
  const { cleaned, hadKeyword } = stripVoiceKeywords(msgObj?.content);

  if (hadKeyword && msgObj && typeof msgObj.content === 'string') {
    msgObj.content = cleaned;
  }

  pendingByChannel.set(channelId, {
    timestamp: Date.now(),
    origName,
    size,
    durationSecs,
    hasTriggerKeyword: hadKeyword,
    hadCaption: cleaned.length > 0,
    renamedToOgg: false,
  });
}

function handleHttpPostBefore(reqOrUrl: any): void {
  if (!reqOrUrl || typeof reqOrUrl !== 'object' || typeof reqOrUrl.url !== 'string') {
    return;
  }
  const body = reqOrUrl.body;
  if (!body || typeof body !== 'object') {
    return;
  }

  const attMatch = ATTACHMENTS_POST_RE.exec(reqOrUrl.url);
  if (attMatch && Array.isArray(body.files) && body.files.length === 1) {
    const channelId = attMatch[1];
    const file = body.files[0];
    if (!isAudioCandidate(file)) {
      return;
    }
    const existing = getFreshPending(channelId);
    const origName = existing?.origName || String(file.filename ?? 'audio.ogg');
    const size = Number(file.file_size ?? existing?.size ?? 0) || 0;
    const durationSecs = existing?.durationSecs ?? estimateDurationFromSize(origName, size);
    const shouldPreRename =
      Boolean(settings.store.renameToOgg) &&
      (settings.store.triggerMode === 'keyword'
        ? Boolean(existing?.hasTriggerKeyword)
        : !existing?.hadCaption || Boolean(existing?.hasTriggerKeyword) || Boolean(settings.store.clearCaptionOnAuto));

    if (shouldPreRename) {
      file.filename = 'voice-message.ogg';
    }

    pendingByChannel.set(channelId, {
      timestamp: Date.now(),
      origName,
      size,
      durationSecs,
      hasTriggerKeyword: Boolean(existing?.hasTriggerKeyword),
      hadCaption: Boolean(existing?.hadCaption),
      renamedToOgg: shouldPreRename,
    });
    return;
  }

  const msgMatch = MESSAGES_POST_RE.exec(reqOrUrl.url);
  if (!msgMatch || !Array.isArray(body.attachments) || body.attachments.length !== 1) {
    return;
  }
  const channelId = msgMatch[1];
  const att = body.attachments[0];
  if (!att || typeof att !== 'object') {
    return;
  }

  const pending = getFreshPending(channelId);
  const attLooksAudio =
    isAudioCandidate(att) || Boolean(pending?.renamedToOgg && att.filename === 'voice-message.ogg');
  if (!attLooksAudio) {
    return;
  }

  const { cleaned, hadKeyword } = stripVoiceKeywords(body.content);
  const hasTrigger = Boolean(pending?.hasTriggerKeyword) || hadKeyword;
  const mode = String(settings.store.triggerMode || 'auto');

  if (mode === 'keyword' && !hasTrigger) {
    pendingByChannel.delete(channelId);
    return;
  }
  if (mode === 'auto' && cleaned.length > 0 && !hasTrigger && !settings.store.clearCaptionOnAuto) {
    pendingByChannel.delete(channelId);
    return;
  }

  const displayName = pending?.origName || String(att.filename || 'audio.ogg');
  const customSecs = Number(settings.store.customDurationSecs) || 0;
  const existingAttDuration = Number(att.duration_secs ?? att.durationSecs) || 0;
  const durationSecs =
    customSecs > 0
      ? Math.max(1, Math.min(1200, Math.round(customSecs * 10) / 10))
      : existingAttDuration > 0
        ? existingAttDuration
        : pending?.durationSecs ?? estimateDurationFromSize(displayName, pending?.size ?? 0);

  if (settings.store.renameToOgg) {
    att.filename = 'voice-message.ogg';
  }
  att.duration_secs = durationSecs;
  att.waveform = generateWaveformBase64(
    String((settings.store.waveformStyle as WaveformStyle) || 'natural'),
    `${channelId}:${att.uploaded_filename || displayName}`,
  );

  body.flags = (Number(body.flags) || 0) | IS_VOICE_MESSAGE_FLAG;
  body.content = '';
  delete body.embeds;
  pendingByChannel.delete(channelId);
  convertedTotal += 1;

  const chName = getChannelStore()?.getChannel?.(channelId)?.name;
  pushNotification({
    title: 'Audio Sent as Voice Message',
    body: `Converted ${displayName} (${durationSecs}s)${chName ? ` in #${chName}` : ''}.`,
    source: 'AudioToVoiceMessage',
    kind: 'success',
    showToast: true,
    channelId,
  });
}

function patchUploadModule(mod: any): void {
  if (!mod || typeof mod.uploadFiles !== 'function' || !markPatched(mod, 'uploadFiles')) {
    return;
  }
  const u: Unpatch = before(mod, 'uploadFiles', handleUploadFilesBefore);
  cleanups.push(u);
}

function patchHttpModule(mod: any): void {
  if (!mod || typeof mod.post !== 'function' || !markPatched(mod, 'post')) {
    return;
  }
  const u: Unpatch = before(mod, 'post', handleHttpPostBefore);
  cleanups.push(u);
}

/**
 * Returns how many audio uploads have been converted into voice messages this session.
 */
export function getAudioToVoiceCount(): number {
  return convertedTotal;
}

export default definePlugin({
  settings,
  start() {
    const existingUpload = findByProps('uploadFiles');
    if (existingUpload) {
      patchUploadModule(existingUpload);
    } else {
      cleanups.push(
        waitFor(
          (m) => typeof m === 'object' && m !== null && typeof m.uploadFiles === 'function',
          patchUploadModule,
        ),
      );
    }

    const isHttpClient = (m: any) =>
      typeof m === 'object' &&
      m !== null &&
      typeof m.get === 'function' &&
      typeof m.post === 'function' &&
      typeof m.patch === 'function' &&
      typeof m.put === 'function' &&
      typeof m.del === 'function';
    const existingHttp = findByProps('get', 'post', 'patch', 'put', 'del');
    if (existingHttp) {
      patchHttpModule(existingHttp);
    } else {
      cleanups.push(waitFor(isHttpClient, patchHttpModule));
    }
  },

  stop() {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
    pendingByChannel.clear();
    patchedModules = new WeakMap<object, Set<string>>();
  },
});
