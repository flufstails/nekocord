import { getChannelStore, getStore, onHttpClient, onMessageActions } from '../../metro/common.js';
import { pushNotification } from '../../notifications/index.js';
import { before } from '../../patcher/index.js';
import { patchOutgoingUploads } from '../../utils/uploader.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const IS_VOICE_MESSAGE_FLAG = 8192;
const PENDING_TTL_MS = 120000;
const ATTACHMENTS_POST_RE = /^\/?channels\/([^/?]+)\/attachments(?:$|\?)/;
const MESSAGES_POST_RE = /^\/?channels\/([^/?]+)\/messages(?:$|\?)/;
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
  waveform: string;
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
    default: true,
  },
});

const pendingByChannel = new Map<string, PendingAudioInfo>();
const cleanups: Array<() => void> = [];
let convertedTotal = 0;

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
  const mime =
    typeof file.mimeType === 'string'
      ? file.mimeType
      : typeof file.type === 'string'
        ? file.type
        : typeof file.content_type === 'string'
          ? file.content_type
          : typeof file.file?.mimeType === 'string'
            ? file.file.mimeType
            : typeof file.file?.type === 'string'
              ? file.file.type
              : typeof file.item?.mimeType === 'string'
                ? file.item.mimeType
                : typeof file.item?.type === 'string'
                  ? file.item.type
                  : '';
  if (/^audio\//i.test(mime)) {
    return true;
  }
  const name =
    file.filename ??
    file.name ??
    file.uploaded_filename ??
    file.uri ??
    file.file?.name ??
    file.file?.filename ??
    file.file?.uri ??
    file.item?.filename ??
    file.item?.name ??
    file.item?.uri ??
    '';
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

function getSelectedOrUploadChannelId(fallback?: string): string {
  if (fallback) return fallback;
  return String(getStore<any>('SelectedChannelStore')?.getChannelId?.() ?? '');
}

function resolveDuration(origName: string, size: number, raw?: any, existing?: PendingAudioInfo | null): number {
  const customSecs = Number(settings.store.customDurationSecs) || 0;
  if (customSecs > 0) {
    return Math.round(Math.max(1, Math.min(1200, customSecs)) * 10) / 10;
  }
  const extracted = raw ? extractRawDurationSecs(raw) : null;
  if (extracted && extracted > 0) {
    return extracted;
  }
  if (existing?.durationSecs && existing.durationSecs > 0) {
    return existing.durationSecs;
  }
  return estimateDurationFromSize(origName, size);
}

function buildPendingFromUpload(channelId: string, raw: any, origName: string, size: number): PendingAudioInfo {
  const existing = getFreshPending(channelId);
  const style = String((settings.store.waveformStyle as WaveformStyle) || 'natural');
  const durationSecs = resolveDuration(origName, size, raw, existing);
  const waveform =
    (typeof raw?.waveform === 'string' && raw.waveform) ||
    existing?.waveform ||
    generateWaveformBase64(style, `${channelId}:${origName}`);

  const info: PendingAudioInfo = {
    timestamp: Date.now(),
    origName: origName === 'voice-message.ogg' && existing?.origName ? existing.origName : origName,
    size: size || existing?.size || 0,
    durationSecs,
    waveform,
    hasTriggerKeyword: Boolean(existing?.hasTriggerKeyword),
    hadCaption: Boolean(existing?.hadCaption),
    renamedToOgg: Boolean(existing?.renamedToOgg),
  };
  pendingByChannel.set(channelId, info);
  return info;
}

function shouldConvertNow(hasKeyword: boolean, hadCaption: boolean, isPostTime: boolean): boolean {
  const mode = String(settings.store.triggerMode || 'auto');
  if (mode === 'keyword') {
    return hasKeyword;
  }
  if (!isPostTime && !hasKeyword && !settings.store.clearCaptionOnAuto && hadCaption) {
    return false;
  }
  if (isPostTime && hadCaption && !hasKeyword && !settings.store.clearCaptionOnAuto) {
    return false;
  }
  return true;
}

function handleOutgoingMessageMeta(channelId: string, message: any): void {
  if (!message || typeof message !== 'object') return;
  const chId = getSelectedOrUploadChannelId(channelId);
  if (!chId) return;

  const { cleaned, hadKeyword } = stripVoiceKeywords(message.content);
  if (hadKeyword && typeof message.content === 'string') {
    message.content = cleaned;
  }

  const existing = getFreshPending(chId);
  const uas = getStore<any>('UploadAttachmentStore');
  const uploads = uas?.getUploads?.(chId, 0) ?? uas?.getUploads?.(chId);
  const singleAudio =
    Array.isArray(uploads) && uploads.length === 1 && (isAudioCandidate(uploads[0]) || existing)
      ? uploads[0]
      : null;

  if (!existing && !singleAudio) {
    return;
  }

  const origName = existing?.origName || String(singleAudio?.filename ?? 'audio.ogg');
  const size = existing?.size || Number(singleAudio?.currentSize ?? singleAudio?.item?.size ?? 0) || 0;
  const info = existing ?? buildPendingFromUpload(chId, singleAudio, origName, size);
  info.timestamp = Date.now();
  info.hasTriggerKeyword = info.hasTriggerKeyword || hadKeyword;
  info.hadCaption = cleaned.length > 0;

  if (singleAudio && shouldConvertNow(info.hasTriggerKeyword, info.hadCaption, false)) {
    singleAudio.durationSecs = info.durationSecs;
    singleAudio.waveform = info.waveform;
    singleAudio.isVoiceMessage = true;
    singleAudio.mimeType = 'audio/ogg';
    if (settings.store.renameToOgg && typeof singleAudio.setFilename === 'function') {
      singleAudio.setFilename('voice-message.ogg');
      info.renamedToOgg = true;
    } else if (settings.store.renameToOgg) {
      singleAudio.filename = 'voice-message.ogg';
      info.renamedToOgg = true;
    }
  }
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
    const existing = getFreshPending(channelId);
    if (!isAudioCandidate(file) && !(existing && file.filename === 'voice-message.ogg')) {
      return;
    }

    const origName = existing?.origName || String(file.filename ?? 'audio.ogg');
    const size = Number(file.file_size ?? existing?.size ?? 0) || 0;
    const info = buildPendingFromUpload(channelId, file, origName, size);

    const shouldRename =
      Boolean(settings.store.renameToOgg) &&
      shouldConvertNow(info.hasTriggerKeyword, info.hadCaption, false);

    if (shouldRename) {
      file.filename = 'voice-message.ogg';
      info.renamedToOgg = true;
    }
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

  if (!shouldConvertNow(hasTrigger, cleaned.length > 0, true)) {
    console.log(
      `[Nekocord/AudioToVoiceMessage] Skipped ${att.filename} (triggerMode=${settings.store.triggerMode}, hadCaption=${cleaned.length > 0}, hasTrigger=${hasTrigger})`,
    );
    pendingByChannel.delete(channelId);
    return;
  }

  const displayName = pending?.origName || String(att.filename || 'audio.ogg');
  const durationSecs = resolveDuration(displayName, pending?.size ?? 0, att, pending);
  const waveform =
    pending?.waveform ||
    generateWaveformBase64(
      String((settings.store.waveformStyle as WaveformStyle) || 'natural'),
      `${channelId}:${att.uploaded_filename || displayName}`,
    );

  if (settings.store.renameToOgg) {
    att.filename = 'voice-message.ogg';
  }
  att.duration_secs = durationSecs;
  att.waveform = waveform;

  body.flags = (Number(body.flags) || 0) | IS_VOICE_MESSAGE_FLAG;
  body.content = '';
  delete body.embeds;
  pendingByChannel.delete(channelId);
  convertedTotal += 1;

  console.log(
    `[Nekocord/AudioToVoiceMessage] Converted ${displayName} (${durationSecs}s, flags=${body.flags}) in ${channelId}`,
  );

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

/**
 * Returns how many audio uploads have been converted into voice messages this session.
 */
export function getAudioToVoiceCount(): number {
  return convertedTotal;
}

export default definePlugin({
  settings,
  start() {
    if (cleanups.length > 0) return;

    console.log(
      `[Nekocord/AudioToVoiceMessage] Started (triggerMode=${settings.store.triggerMode}, renameToOgg=${settings.store.renameToOgg}, clearCaptionOnAuto=${settings.store.clearCaptionOnAuto})`,
    );

    cleanups.push(
      patchOutgoingUploads((item, ctx) => {
        if (
          !isAudioCandidate(item.raw) &&
          !/^audio\//i.test(item.mimeType) &&
          !AUDIO_EXT_RE.test(item.filename.trim())
        ) {
          return;
        }
        const chId = getSelectedOrUploadChannelId(item.channelId);
        if (!chId) return;

        const msgObj = ctx.parsedMessage;
        const { cleaned, hadKeyword } = stripVoiceKeywords(msgObj?.content);
        if (hadKeyword && msgObj && typeof msgObj.content === 'string') {
          msgObj.content = cleaned;
        }

        const info = buildPendingFromUpload(chId, item.raw, item.filename || 'audio.ogg', item.size);
        if (hadKeyword) {
          info.hasTriggerKeyword = true;
        }
        if (cleaned.length > 0) {
          info.hadCaption = true;
        }

        if (shouldConvertNow(info.hasTriggerKeyword, info.hadCaption, false)) {
          item.raw.durationSecs = info.durationSecs;
          item.raw.waveform = info.waveform;
          item.raw.isVoiceMessage = true;
          item.raw.mimeType = 'audio/ogg';
          if (settings.store.renameToOgg && item.filename !== 'voice-message.ogg') {
            item.setFilename('voice-message.ogg');
            info.renamedToOgg = true;
          }
          console.log(
            `[Nekocord/AudioToVoiceMessage] Prepared ${info.origName} at stage=${ctx.stage} (${info.durationSecs}s)`,
          );
          return true;
        }
      }),
    );

    cleanups.push(
      onMessageActions((actions: any) => {
        if (typeof actions.sendMessage === 'function') {
          cleanups.push(
            before(actions, 'sendMessage', (channelId: any, message: any) => {
              handleOutgoingMessageMeta(String(channelId ?? ''), message);
            }),
          );
        }
        if (typeof actions._sendMessage === 'function') {
          cleanups.push(
            before(actions, '_sendMessage', (channelId: any, message: any) => {
              handleOutgoingMessageMeta(String(channelId ?? ''), message);
            }),
          );
        }
      }),
    );

    cleanups.push(
      onHttpClient((http: any) => {
        if (typeof http?.post === 'function') {
          cleanups.push(before(http, 'post', handleHttpPostBefore));
        }
      }),
    );
  },

  stop() {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
    pendingByChannel.clear();
  },
});
