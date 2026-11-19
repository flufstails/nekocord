import {
  getChannelStore,
  getStore,
  getUserStore,
  isMessageActions,
  onMessageActions,
  type MessageActionCreators,
} from '../../metro/common.js';
import {
  type ComponentPatchTarget,
  findByProps,
  getModules,
  waitFor,
  watchNamedExports,
} from '../../metro/index.js';
import { after, before, instead, type Unpatch } from '../../patcher/index.js';
import { registerMessageRowTransformer } from '../../chat/rows.js';
import { transformOutsideCode, transformOutsideCodeAndTokens } from '../../utils/text.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  enableEmojiBypass: {
    type: OptionType.BOOLEAN,
    label: 'Enable Emoji Bypass',
    description: 'Unlock external and animated emojis in the picker and rewrite locked sends to CDN links.',
    default: true,
  },
  enableStickerBypass: {
    type: OptionType.BOOLEAN,
    label: 'Enable Sticker Bypass',
    description: 'Unlock Nitro stickers in the picker and convert locked sticker sends cleanly.',
    default: true,
  },
  emojiSize: {
    type: OptionType.SELECT,
    label: 'Emoji Size',
    description: 'Image size parameter appended to bypassed custom emoji URLs.',
    default: 48,
    options: [
      { label: '32px', value: 32 },
      { label: '48px (Default)', value: 48 },
      { label: '64px', value: 64 },
      { label: '128px', value: 128 },
    ],
  },
  stickerSize: {
    type: OptionType.SELECT,
    label: 'Sticker Size',
    description: 'Image dimension used when sending and rendering bypassed stickers.',
    default: 160,
    options: [
      { label: '128px', value: 128 },
      { label: '160px (Default)', value: 160 },
      { label: '256px', value: 256 },
    ],
  },
});

const CAPABILITY_METHODS = new Set([
  'canUseEmojisEverywhere',
  'canUseAnimatedEmojis',
  'canUseCustomStickersEverywhere',
  'canUseStickersEverywhere',
  'canUseClientThemes',
  'canUseSoundboardEverywhere',
  'canUseCustomCallSounds',
  'canStreamQuality',
  'canUseHighVideoUploadQuality',
  'canUseIncreasedMessageLength',
  'canUsePremiumAppIcons',
]);

const EMOJI_BOOL_LOCK_METHODS = new Set([
  'isEmojiDisabled',
  'isEmojiPremiumLocked',
  'isEmojiFiltered',
]);

const CATEGORY_LOCK_METHODS = new Set([
  'isEmojiCategoryNitroLocked',
  'isStickerCategoryNitroLocked',
]);

const FAKENITRO_TARGET_NAMES = new Set([
  ...CAPABILITY_METHODS,
  'getEmojiUnavailableReason',
  ...EMOJI_BOOL_LOCK_METHODS,
  ...CATEGORY_LOCK_METHODS,
  'getStickerSendability',
  'isSendableSticker',
  'sendStickers',
  'sendSticker',
  'sendGreetMessage',
  '_sendMessage',
]);

const CUSTOM_EMOJI_RE = /<(a?):([^:>\s]+):(\d+)>/g;
const SHORTCODE_RE = /:([a-zA-Z0-9_~-]{2,32}):/g;
const MESSAGES_POST_RE = /^\/?channels\/(\d+)\/messages(?:$|\?)/;
const FAKE_EMOJI_URL_EXACT_RE =
  /^https?:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\/emojis\/(\d+)\.(webp|png|gif)(?:\?([^\s]*))?$/i;
const FAKE_STICKER_URL_EXACT_RE =
  /^https?:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\/stickers\/(\d+)\.(png|webp|gif)(?:\?([^\s]*))?$/i;
const FAKE_MEDIA_URL_INLINE_RE =
  /https?:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\/(?:emojis|stickers)\/\d+\.(?:webp|png|gif)(?:\?[^\s<>()[\]]*)?/gi;

let convertedCount = 0;
let unlockedChecks = 0;
let pickerHooks = 0;
let bypassCapabilityOverride = false;
let origGetStickerSendability: ((...args: any[]) => any) | null = null;
let origIsSendableSticker: ((...args: any[]) => any) | null = null;
let origGetEmojiUnavailableReason: ((...args: any[]) => any) | null = null;
let origIsEmojiDisabled: ((...args: any[]) => any) | null = null;
let origIsEmojiPremiumLocked: ((...args: any[]) => any) | null = null;
let origIsEmojiFiltered: ((...args: any[]) => any) | null = null;
let cachedMessageActions: MessageActionCreators | null = null;
let patchedMethods = new WeakMap<object, Set<string>>();
const cleanups: Array<() => void> = [];

function getUserPremiumType(): number {
  try {
    const user = getUserStore()?.getCurrentUser?.();
    return Number(user?.premiumType ?? 0);
  } catch {
    return 0;
  }
}

function userHasFullNitro(): boolean {
  return getUserPremiumType() === 2;
}

function getEmojiStoreObj(): any {
  return getStore<any>('EmojiStore') ?? findByProps<any>('getCustomEmojiById');
}

function findCustomEmojiById(id: string): any {
  const emojiStore = getEmojiStoreObj();
  try {
    if (emojiStore) {
      if (typeof emojiStore.getCustomEmojiById === 'function') {
        const hit = emojiStore.getCustomEmojiById(id);
        if (hit) return hit;
      }
      if (typeof emojiStore.getUsableCustomEmojiById === 'function') {
        const hit = emojiStore.getUsableCustomEmojiById(id);
        if (hit) return hit;
      }
    }
    const helper = findByProps<any>('getCustomEmojiById');
    if (helper && helper !== emojiStore && typeof helper.getCustomEmojiById === 'function') {
      const hit = helper.getCustomEmojiById(id);
      if (hit) return hit;
    }
  } catch {
    // Ignore store lookup errors.
  }
  return undefined;
}

function matchesEmojiEntryName(entry: any, exactName: string, lowerName: string): boolean {
  if (!entry || !entry.id) {
    return false;
  }
  const unique = typeof entry.uniqueName === 'string' ? entry.uniqueName : '';
  const base = typeof entry.name === 'string' ? entry.name : '';
  return (
    unique === exactName ||
    base === exactName ||
    unique.toLowerCase() === lowerName ||
    base.toLowerCase() === lowerName
  );
}

function findCustomEmojiByName(name: string, currentGuildId?: string): any {
  const emojiStore = getEmojiStoreObj();
  if (!emojiStore || !name) {
    return undefined;
  }
  const lower = name.toLowerCase();
  try {
    if (typeof emojiStore.getDisambiguatedEmojiContext === 'function') {
      let ciMatch: any;
      for (const guildScope of [currentGuildId, undefined]) {
        const ctx = emojiStore.getDisambiguatedEmojiContext(guildScope);
        const byName = ctx?.getByName?.(name);
        if (byName && (byName.id != null || byName.guildId != null)) {
          return byName;
        }
        const customMap = ctx?.customEmojis;
        if (customMap && typeof customMap === 'object') {
          if (customMap instanceof Map) {
            for (const entry of customMap.values()) {
              if (entry?.id && (entry.uniqueName === name || entry.name === name)) {
                return entry;
              }
              if (!ciMatch && matchesEmojiEntryName(entry, name, lower)) {
                ciMatch = entry;
              }
            }
          } else {
            const direct = customMap[name];
            if (direct?.id) {
              return direct;
            }
            const vals = Object.values(customMap);
            for (let i = 0; i < vals.length; i += 1) {
              const entry = vals[i] as any;
              if (entry?.id && (entry.uniqueName === name || entry.name === name)) {
                return entry;
              }
              if (!ciMatch && matchesEmojiEntryName(entry, name, lower)) {
                ciMatch = entry;
              }
            }
          }
        }
      }
      if (ciMatch) {
        return ciMatch;
      }
    }

    if (typeof emojiStore.getGuilds === 'function') {
      const guilds = emojiStore.getGuilds();
      if (guilds && typeof guilds === 'object') {
        let ciMatch: any;
        const guildList = Object.values(guilds);
        for (let i = 0; i < guildList.length; i += 1) {
          const guild = guildList[i] as any;
          const rawEmojis = guild?.emojis ?? guild?.rawEmojis ?? guild;
          if (!rawEmojis || typeof rawEmojis !== 'object') {
            continue;
          }
          const list: any[] = Array.isArray(rawEmojis)
            ? rawEmojis
            : rawEmojis instanceof Map
              ? Array.from(rawEmojis.values())
              : Object.values(rawEmojis);
          for (let j = 0; j < list.length; j += 1) {
            const entry = list[j];
            if (entry?.id && (entry.uniqueName === name || entry.name === name)) {
              return entry;
            }
            if (!ciMatch && matchesEmojiEntryName(entry, name, lower)) {
              ciMatch = entry;
            }
          }
        }
        if (ciMatch) {
          return ciMatch;
        }
      }
    }
  } catch {
    // Ignore store scan errors.
  }
  return undefined;
}

function findStickerById(id: string): any {
  const storeCandidates = [
    getStore<any>('StickersStore'),
    getStore<any>('GuildStickersStore'),
    getStore<any>('StickersPackStore'),
    getStore<any>('StickerStore'),
    findByProps<any>('getStickerById'),
  ];
  for (let i = 0; i < storeCandidates.length; i += 1) {
    const store = storeCandidates[i];
    if (!store || typeof store.getStickerById !== 'function') {
      continue;
    }
    try {
      const hit = store.getStickerById(id);
      if (hit) {
        return hit;
      }
    } catch {
      // Ignore individual store read failures.
    }
  }
  return undefined;
}

function resolveMessageActions(): MessageActionCreators | undefined {
  return cachedMessageActions ?? findByProps<MessageActionCreators>('sendMessage', 'editMessage');
}

function getCurrentGuildId(channelId: string): string | undefined {
  try {
    return getChannelStore()?.getChannel?.(channelId)?.guild_id;
  } catch {
    return undefined;
  }
}

function isReactionIntention(args: any[]): boolean {
  const opts = args[0];
  if (typeof opts === 'number') {
    return opts === 0 || opts === 11;
  }
  if (!opts || typeof opts !== 'object') {
    return false;
  }
  const intention = opts.intention ?? args[1];
  return intention === 0 || intention === 11;
}

function buildEmojiUrl(id: string, animated: boolean, name?: string): string {
  const ext = animated ? 'gif' : 'webp';
  const size = Number(settings.store.emojiSize) || 48;
  const safeName =
    typeof name === 'string' && name.trim() ? `&name=${encodeURIComponent(name.trim())}` : '';
  return `https://cdn.discordapp.com/emojis/${id}.${ext}?size=${size}&quality=lossless${safeName}`;
}

function buildStickerUrl(sticker: any): string {
  const size = Number(settings.store.stickerSize) || 160;
  const safeName =
    typeof sticker?.name === 'string' && sticker.name.trim()
      ? `&name=${encodeURIComponent(sticker.name.trim())}`
      : '';
  if (sticker.format_type === 4) {
    return `https://media.discordapp.net/stickers/${sticker.id}.gif?size=${size}${safeName}`;
  }
  if (sticker.format_type === 2) {
    return `https://media.discordapp.net/stickers/${sticker.id}.png?size=${size}&passthrough=true${safeName}`;
  }
  return `https://media.discordapp.net/stickers/${sticker.id}.png?size=${size}${safeName}`;
}

function extractQueryParam(query: string | undefined, key: string): string | null {
  if (!query) {
    return null;
  }
  const parts = query.split('&');
  for (let i = 0; i < parts.length; i += 1) {
    const eqIdx = parts[i].indexOf('=');
    if (eqIdx <= 0) {
      continue;
    }
    if (parts[i].slice(0, eqIdx) !== key) {
      continue;
    }
    const rawVal = parts[i].slice(eqIdx + 1);
    try {
      const decoded = decodeURIComponent(rawVal.replace(/\+/g, ' ')).trim();
      if (decoded) {
        return decoded;
      }
    } catch {
      if (rawVal.trim()) {
        return rawVal.trim();
      }
    }
  }
  return null;
}

function parseFakeEmojiUrl(rawUrl: string): {
  id: string;
  ext: string;
  name: string;
  src: string;
  frozenSrc: string;
} | null {
  const match = FAKE_EMOJI_URL_EXACT_RE.exec(rawUrl.trim());
  if (!match) {
    return null;
  }
  const id = match[1];
  const ext = match[2].toLowerCase();
  const query = match[3];
  const qName = extractQueryParam(query, 'name');
  const stored = findCustomEmojiById(id);
  const name = qName || (typeof stored?.name === 'string' && stored.name.trim()) || 'emoji';
  const emojiSz = Number(settings.store.emojiSize) || 48;
  return {
    id,
    ext,
    name,
    src: `https://cdn.discordapp.com/emojis/${id}.${ext}?size=${emojiSz}&quality=lossless`,
    frozenSrc: `https://cdn.discordapp.com/emojis/${id}.webp?size=${emojiSz}&quality=lossless`,
  };
}

function parseFakeStickerUrl(rawUrl: string): {
  id: string;
  format_type: 1 | 2 | 4;
  name: string;
  asset: string;
  url: string;
  width: number;
  height: number;
  renderMode: number;
  accessibilityLabel: string;
} | null {
  const match = FAKE_STICKER_URL_EXACT_RE.exec(rawUrl.trim());
  if (!match) {
    return null;
  }
  const id = match[1];
  const ext = match[2].toLowerCase();
  const query = match[3] ?? '';
  const qName = extractQueryParam(query, 'name');
  const stored = findStickerById(id);
  const name = qName || (typeof stored?.name === 'string' && stored.name.trim()) || 'sticker';
  const formatType: 1 | 2 | 4 =
    ext === 'gif' ? 4 : query.includes('passthrough=true') ? 2 : 1;
  const stickerSz = Number(settings.store.stickerSize) || 160;
  const cleanUrl =
    formatType === 4
      ? `https://media.discordapp.net/stickers/${id}.gif?size=${stickerSz}`
      : formatType === 2
        ? `https://media.discordapp.net/stickers/${id}.png?size=${stickerSz}&passthrough=true`
        : `https://media.discordapp.net/stickers/${id}.png?size=${stickerSz}`;
  return {
    id,
    format_type: formatType,
    name,
    asset: '',
    url: cleanUrl,
    width: stickerSz,
    height: stickerSz,
    renderMode: 0,
    accessibilityLabel: `Sticker, ${name}`,
  };
}

function makeCustomEmojiNode(info: {
  id: string;
  name: string;
  src: string;
  frozenSrc: string;
}) {
  return {
    type: 'customEmoji',
    id: info.id,
    alt: info.name,
    src: info.src,
    frozenSrc: info.frozenSrc,
    jumboable: false,
  };
}

function flattenTextContent(val: unknown): string {
  if (typeof val === 'string') {
    return val;
  }
  if (Array.isArray(val)) {
    let out = '';
    for (let i = 0; i < val.length; i += 1) {
      out += flattenTextContent(val[i]);
    }
    return out;
  }
  if (val && typeof val === 'object') {
    const obj = val as Record<string, any>;
    if (obj.content !== undefined) {
      return flattenTextContent(obj.content);
    }
  }
  return '';
}

function getLinkNodeUrl(node: any): string | null {
  if (!node || typeof node !== 'object') {
    return null;
  }
  if (typeof node.target === 'string' && node.target) {
    return node.target;
  }
  if (node.target && typeof node.target === 'object' && typeof node.target.url === 'string') {
    return node.target.url;
  }
  if (typeof node.url === 'string' && node.url) {
    return node.url;
  }
  const inner = flattenTextContent(node.content).trim();
  return inner.startsWith('http://') || inner.startsWith('https://') ? inner : null;
}

function analyzeContentNodes(
  nodes: any[],
  jumboableValue?: boolean,
): { emojiCount: number; hasNonEmojiContent: boolean } {
  let emojiCount = 0;
  let hasNonEmojiContent = false;
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (typeof node === 'string') {
      if (node.trim().length > 0) {
        hasNonEmojiContent = true;
      }
      continue;
    }
    if (!node || typeof node !== 'object') {
      continue;
    }
    if (node.type === 'customEmoji') {
      emojiCount += 1;
      if (jumboableValue !== undefined) {
        node.jumboable = jumboableValue;
      }
      continue;
    }
    if (node.type === 'text') {
      if (typeof node.content === 'string' && node.content.trim().length > 0) {
        hasNonEmojiContent = true;
      }
      continue;
    }
    if (Array.isArray(node.content)) {
      const inner = analyzeContentNodes(node.content, jumboableValue);
      emojiCount += inner.emojiCount;
      if (inner.hasNonEmojiContent) {
        hasNonEmojiContent = true;
      }
      continue;
    }
    hasNonEmojiContent = true;
  }
  return { emojiCount, hasNonEmojiContent };
}

function transformFakeNitroRow(row: Record<string, any>): boolean {
  const msg = row.message;
  if (!msg || typeof msg !== 'object') {
    return false;
  }

  const seenEmojiIds = new Set<string>();
  const seenStickerIds = new Set<string>();
  if (Array.isArray(msg.stickers)) {
    for (let i = 0; i < msg.stickers.length; i += 1) {
      const id = msg.stickers[i]?.id;
      if (id != null) {
        seenStickerIds.add(String(id));
      }
    }
  }

  const extractedStickers: any[] = [];
  let mutated = false;

  const transformInlineText = (text: string): { nodes: any[]; changed: boolean } => {
    FAKE_MEDIA_URL_INLINE_RE.lastIndex = 0;
    if (!FAKE_MEDIA_URL_INLINE_RE.test(text)) {
      return { nodes: [{ type: 'text', content: text }], changed: false };
    }
    FAKE_MEDIA_URL_INLINE_RE.lastIndex = 0;
    const out: any[] = [];
    let lastIdx = 0;
    let changed = false;
    let m: RegExpExecArray | null;
    while ((m = FAKE_MEDIA_URL_INLINE_RE.exec(text)) !== null) {
      const url = m[0];
      const emojiInfo = parseFakeEmojiUrl(url);
      const stickerInfo = emojiInfo ? null : parseFakeStickerUrl(url);
      if (!emojiInfo && !stickerInfo) {
        continue;
      }
      if (m.index > lastIdx) {
        const beforeText = text.slice(lastIdx, m.index);
        if (beforeText) {
          out.push({ type: 'text', content: beforeText });
        }
      }
      changed = true;
      if (emojiInfo) {
        seenEmojiIds.add(emojiInfo.id);
        out.push(makeCustomEmojiNode(emojiInfo));
      } else if (stickerInfo && !seenStickerIds.has(stickerInfo.id)) {
        seenStickerIds.add(stickerInfo.id);
        extractedStickers.push(stickerInfo);
      }
      lastIdx = m.index + url.length;
    }
    if (!changed) {
      return { nodes: [{ type: 'text', content: text }], changed: false };
    }
    if (lastIdx < text.length) {
      const tail = text.slice(lastIdx);
      if (tail) {
        out.push({ type: 'text', content: tail });
      }
    }
    return { nodes: out, changed: true };
  };

  const transformNodeList = (nodes: any[]): { nodes: any[]; changed: boolean } => {
    const out: any[] = [];
    let changed = false;
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (typeof node === 'string') {
        const res = transformInlineText(node);
        if (res.changed) {
          changed = true;
          out.push(...res.nodes);
        } else {
          out.push(node);
        }
        continue;
      }
      if (!node || typeof node !== 'object') {
        out.push(node);
        continue;
      }
      if (node.type === 'customEmoji' && node.id != null) {
        seenEmojiIds.add(String(node.id));
        out.push(node);
        continue;
      }
      if (node.type === 'text' && typeof node.content === 'string') {
        const res = transformInlineText(node.content);
        if (res.changed) {
          changed = true;
          out.push(...res.nodes);
        } else {
          out.push(node);
        }
        continue;
      }
      if (node.type === 'link') {
        const url = getLinkNodeUrl(node);
        if (url) {
          const emojiInfo = parseFakeEmojiUrl(url);
          if (emojiInfo) {
            changed = true;
            seenEmojiIds.add(emojiInfo.id);
            out.push(makeCustomEmojiNode(emojiInfo));
            continue;
          }
          const stickerInfo = parseFakeStickerUrl(url);
          if (stickerInfo) {
            changed = true;
            if (!seenStickerIds.has(stickerInfo.id)) {
              seenStickerIds.add(stickerInfo.id);
              extractedStickers.push(stickerInfo);
            }
            continue;
          }
        }
        out.push(node);
        continue;
      }
      if (Array.isArray(node.content)) {
        const inner = transformNodeList(node.content);
        if (inner.changed) {
          changed = true;
          if (inner.nodes.length > 0) {
            out.push({ ...node, content: inner.nodes });
          }
        } else {
          out.push(node);
        }
        continue;
      }
      out.push(node);
    }
    return { nodes: out, changed };
  };

  if (typeof msg.content === 'string') {
    const res = transformInlineText(msg.content);
    if (res.changed) {
      msg.content = res.nodes;
      mutated = true;
    }
  } else if (Array.isArray(msg.content)) {
    const res = transformNodeList(msg.content);
    if (res.changed) {
      msg.content = res.nodes;
      mutated = true;
    }
  }

  const ensureContentArray = (): any[] => {
    if (Array.isArray(msg.content)) {
      return msg.content;
    }
    if (typeof msg.content === 'string' && msg.content.length > 0) {
      msg.content = [{ type: 'text', content: msg.content }];
    } else {
      msg.content = [];
    }
    return msg.content;
  };

  if (Array.isArray(msg.embeds) && msg.embeds.length > 0) {
    const remainingEmbeds: any[] = [];
    let droppedAnyEmbed = false;
    for (let i = 0; i < msg.embeds.length; i += 1) {
      const embed = msg.embeds[i];
      const candidates = [
        embed?.url,
        embed?.image?.url,
        embed?.image?.proxyURL,
        embed?.thumbnail?.url,
        embed?.thumbnail?.proxyURL,
      ];
      let matched = false;
      for (let c = 0; c < candidates.length; c += 1) {
        const rawUrl = candidates[c];
        if (typeof rawUrl !== 'string' || !rawUrl) {
          continue;
        }
        const emojiInfo = parseFakeEmojiUrl(rawUrl);
        if (emojiInfo) {
          matched = true;
          droppedAnyEmbed = true;
          if (!seenEmojiIds.has(emojiInfo.id)) {
            seenEmojiIds.add(emojiInfo.id);
            ensureContentArray().push(makeCustomEmojiNode(emojiInfo));
          }
          break;
        }
        const stickerInfo = parseFakeStickerUrl(rawUrl);
        if (stickerInfo) {
          matched = true;
          droppedAnyEmbed = true;
          if (!seenStickerIds.has(stickerInfo.id)) {
            seenStickerIds.add(stickerInfo.id);
            extractedStickers.push(stickerInfo);
          }
          break;
        }
      }
      if (!matched) {
        remainingEmbeds.push(embed);
      }
    }
    if (droppedAnyEmbed) {
      mutated = true;
      if (remainingEmbeds.length > 0) {
        msg.embeds = remainingEmbeds;
      } else {
        delete msg.embeds;
      }
    }
  }

  if (extractedStickers.length > 0) {
    msg.stickers = Array.isArray(msg.stickers)
      ? [...msg.stickers, ...extractedStickers]
      : extractedStickers;
    mutated = true;
  }

  if (mutated && Array.isArray(msg.content)) {
    const summary = analyzeContentNodes(msg.content);
    if (summary.emojiCount === 0 && !summary.hasNonEmojiContent) {
      delete msg.content;
    } else if (
      summary.emojiCount >= 1 &&
      summary.emojiCount <= 27 &&
      !summary.hasNonEmojiContent &&
      extractedStickers.length === 0 &&
      !(Array.isArray(msg.stickers) && msg.stickers.length > 0)
    ) {
      analyzeContentNodes(msg.content, true);
    }
  }

  return mutated;
}

function runWithBypass<T>(fn: (() => T) | null | undefined): T | undefined {
  if (typeof fn !== 'function') {
    return undefined;
  }
  bypassCapabilityOverride = true;
  try {
    return fn();
  } catch {
    return undefined;
  } finally {
    bypassCapabilityOverride = false;
  }
}

function needsFakeEmoji(emoji: any, channelId: string, animatedHint = false): boolean {
  if (!settings.store.enableEmojiBypass) {
    return false;
  }
  const channel = channelId ? getChannelStore()?.getChannel?.(channelId) : undefined;
  if (emoji) {
    if (origGetEmojiUnavailableReason) {
      const reason = runWithBypass(() =>
        origGetEmojiUnavailableReason!({ emoji, channel, intention: 3 }),
      );
      if (reason != null) {
        return true;
      }
    }
    if (origIsEmojiPremiumLocked) {
      if (runWithBypass(() => origIsEmojiPremiumLocked!({ emoji, channel, intention: 3 })) === true) {
        return true;
      }
    }
    if (origIsEmojiDisabled) {
      if (runWithBypass(() => origIsEmojiDisabled!({ emoji, channel, intention: 3 })) === true) {
        return true;
      }
    }
  }
  if (userHasFullNitro()) {
    return false;
  }
  const animated = Boolean(emoji?.animated ?? animatedHint);
  const currentGuildId = channel?.guild_id;
  const emojiGuildId = emoji?.guildId ?? emoji?.guild_id;
  return Boolean(
    animated ||
      !emoji ||
      emoji.available === false ||
      !currentGuildId ||
      (emojiGuildId != null && String(emojiGuildId) !== String(currentGuildId)),
  );
}

function needsFakeSticker(sticker: any, channelId: string): boolean {
  if (!settings.store.enableStickerBypass || !sticker || !sticker.id) {
    return false;
  }
  const user = getUserStore()?.getCurrentUser?.();
  const channel = channelId ? getChannelStore()?.getChannel?.(channelId) : undefined;
  if (origGetStickerSendability) {
    const sendability = runWithBypass(() => origGetStickerSendability!(sticker, user, channel));
    if (typeof sendability === 'number' && sendability !== 0) {
      return true;
    }
  }
  if (origIsSendableSticker) {
    const sendable = runWithBypass(() => origIsSendableSticker!(sticker, user, channel));
    if (sendable === false) {
      return true;
    }
  }
  if (sticker.available === false) {
    return true;
  }
  if (userHasFullNitro()) {
    return false;
  }
  const currentGuildId = channel?.guild_id ?? getCurrentGuildId(channelId);
  return Boolean(
    sticker.pack_id ||
      !currentGuildId ||
      (sticker.guild_id && String(sticker.guild_id) !== String(currentGuildId)),
  );
}

function markPatchedMethod(target: object, key: string): boolean {
  let keys = patchedMethods.get(target);
  if (!keys) {
    keys = new Set<string>();
    patchedMethods.set(target, keys);
  }
  if (keys.has(key)) {
    return false;
  }
  keys.add(key);
  return true;
}

function extractStickerUrlsFromIds(stickerIds: unknown[], channelId: string): {
  urls: string[];
  keepIds: unknown[];
} {
  const urls: string[] = [];
  const keepIds: unknown[] = [];

  for (let i = 0; i < stickerIds.length; i += 1) {
    const raw = stickerIds[i];
    const rawId =
      typeof raw === 'object' && raw !== null && 'id' in raw
        ? String((raw as any).id ?? '')
        : raw != null
          ? String(raw)
          : '';
    const sticker =
      typeof raw === 'object' && raw !== null && 'id' in raw
        ? raw
        : rawId
          ? findStickerById(rawId)
          : undefined;

    if (sticker) {
      if (needsFakeSticker(sticker, channelId)) {
        urls.push(buildStickerUrl(sticker));
        convertedCount += 1;
      } else {
        keepIds.push(sticker.id);
      }
      continue;
    }

    if (settings.store.enableStickerBypass && !userHasFullNitro() && rawId) {
      const sz = Number(settings.store.stickerSize) || 160;
      urls.push(`https://media.discordapp.net/stickers/${rawId}.png?size=${sz}`);
      convertedCount += 1;
    } else if (raw != null) {
      keepIds.push(raw);
    }
  }

  return { urls, keepIds };
}

function sendStickersWithBypass(
  actionsHint: MessageActionCreators | undefined,
  args: any[],
  orig: (...a: any[]) => any,
  channelId: string,
  rawIds: unknown[],
  rawText: unknown,
  extraObj: Record<string, any> | undefined,
): any {
  if (!channelId || rawIds.length === 0) {
    return orig(...args);
  }

  const { urls, keepIds } = extractStickerUrlsFromIds(rawIds, channelId);
  console.log(
    `[Nekocord/FakeNitro] sendStickers call (ch=${channelId}, ids=${rawIds.length}, premium=${getUserPremiumType()}, converted=${urls.length}, keep=${keepIds.length})`,
  );

  if (urls.length === 0) {
    return orig(...args);
  }

  const actions = actionsHint ?? resolveMessageActions();
  if (!actions || typeof actions.sendMessage !== 'function') {
    return orig(...args);
  }

  const safeExtra = extraObj ? { ...extraObj } : undefined;
  if (safeExtra) {
    delete safeExtra.stickerIds;
    delete safeExtra.sticker_ids;
  }

  const textPrefix =
    typeof rawText === 'string' && rawText.trim() ? `${rawText.trim()}\n` : '';
  const payload = {
    content: `${textPrefix}${urls.join('\n')}`,
    tts: false,
    invalidEmojis: [],
    validNonShortcutEmojis: [],
  };

  if (keepIds.length > 0) {
    const firstPass = actions.sendMessage(channelId, payload, undefined, safeExtra);
    try {
      orig(channelId, keepIds, typeof rawText === 'string' ? undefined : args[2], safeExtra);
    } catch {
      // Keep primary converted message delivery intact if unlocked companion call fails.
    }
    return firstPass;
  }

  return actions.sendMessage(channelId, payload, undefined, safeExtra);
}

function patchStickerExportMethod(
  target: any,
  key: 'sendStickers' | 'sendSticker' | 'sendGreetMessage',
): void {
  if (!target || typeof target[key] !== 'function' || !markPatchedMethod(target, key)) {
    return;
  }
  const u = instead(target, key, (args, orig) => {
    const firstObj =
      args[0] && typeof args[0] === 'object' ? (args[0] as Record<string, any>) : null;
    const isChannelLike =
      Boolean(firstObj) &&
      'id' in firstObj! &&
      !('channelId' in firstObj!) &&
      !('stickerIds' in firstObj!) &&
      !('sticker_ids' in firstObj!) &&
      !('sticker' in firstObj!);
    const channelId = firstObj
      ? String(isChannelLike ? firstObj.id ?? '' : firstObj.channelId ?? '')
      : String(args[0] ?? '');
    const raw =
      firstObj && !isChannelLike
        ? (firstObj.stickerIds ?? firstObj.sticker_ids ?? firstObj.sticker ?? firstObj.stickerId)
        : args[1];
    const ids = Array.isArray(raw)
      ? raw
      : raw?.id != null
        ? [raw]
        : raw != null
          ? [raw]
          : [];
    const rawText = firstObj && !isChannelLike ? firstObj.content : args[2];
    const extraObj =
      firstObj && !isChannelLike
        ? firstObj.extra && typeof firstObj.extra === 'object'
          ? firstObj.extra
          : undefined
        : args[3] && typeof args[3] === 'object'
          ? args[3]
          : args[2] && typeof args[2] === 'object'
            ? args[2]
            : undefined;

    return sendStickersWithBypass(
      resolveMessageActions(),
      args,
      orig,
      channelId,
      ids,
      rawText,
      extraObj,
    );
  });
  cleanups.push(u);
  pickerHooks += 1;
  console.log(`[Nekocord/FakeNitro] Hooked ${key}`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processOutgoingMessage(
  channelId: string,
  message: any,
  arg2?: any,
  arg3?: any,
  arg4?: any,
): void {
  if (!message || typeof message !== 'object') {
    return;
  }

  const convertedEmojiIds = new Set<string>();
  const appendedUrls: string[] = [];
  const currentGuildId = channelId ? getCurrentGuildId(channelId) : undefined;
  let localConversions = 0;

  if (typeof message.content === 'string' && message.content.includes('<')) {
    message.content = transformOutsideCode(message.content, (segment) =>
      segment.replace(CUSTOM_EMOJI_RE, (full, animFlag: string, _name: string, id: string) => {
        const emoji = findCustomEmojiById(id);
        const animated = animFlag === 'a' || Boolean(emoji?.animated);
        if (!needsFakeEmoji(emoji, channelId, animated)) {
          return full;
        }
        convertedEmojiIds.add(String(id));
        convertedCount += 1;
        localConversions += 1;
        return buildEmojiUrl(id, animated, emoji?.name ?? _name);
      }),
    );
  }

  const processEmojiArray = (entries: any[]): any[] => {
    const remaining: any[] = [];
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const id = entry?.id != null ? String(entry.id) : '';
      if (id && convertedEmojiIds.has(id)) {
        continue;
      }
      const stored = id ? findCustomEmojiById(id) ?? entry : entry;
      const animated = Boolean(stored?.animated ?? entry?.animated);
      if (id && needsFakeEmoji(stored, channelId, animated)) {
        convertedEmojiIds.add(id);
        convertedCount += 1;
        localConversions += 1;
        const rawName =
          typeof entry?.name === 'string'
            ? entry.name
            : typeof stored?.name === 'string'
              ? stored.name
              : '';
        const url = buildEmojiUrl(id, animated, rawName);
        if (rawName && typeof message.content === 'string') {
          const shortcodeRe = new RegExp(`:${escapeRegExp(rawName)}:`, 'g');
          let replacedShortcode = false;
          message.content = transformOutsideCodeAndTokens(
            message.content,
            (segment) =>
              segment.replace(shortcodeRe, () => {
                replacedShortcode = true;
                return url;
              }),
            false,
          );
          if (!replacedShortcode && !message.content.includes(url)) {
            appendedUrls.push(url);
          }
        } else {
          appendedUrls.push(url);
        }
      } else {
        remaining.push(entry);
      }
    }
    return remaining;
  };

  if (Array.isArray(message.invalidEmojis) && message.invalidEmojis.length > 0) {
    message.invalidEmojis = processEmojiArray(message.invalidEmojis);
  }

  if (
    Array.isArray(message.validNonShortcutEmojis) &&
    message.validNonShortcutEmojis.length > 0
  ) {
    message.validNonShortcutEmojis = processEmojiArray(message.validNonShortcutEmojis);
  }

  if (typeof message.content === 'string' && message.content.includes(':')) {
    message.content = transformOutsideCodeAndTokens(
      message.content,
      (plain) =>
        plain.replace(SHORTCODE_RE, (full, name: string) => {
          const emoji = findCustomEmojiByName(name, currentGuildId);
          if (!emoji || !emoji.id) {
            return full;
          }
          const id = String(emoji.id);
          const animated = Boolean(emoji.animated);
          if (!needsFakeEmoji(emoji, channelId, animated)) {
            return full;
          }
          convertedEmojiIds.add(id);
          convertedCount += 1;
          localConversions += 1;
          return buildEmojiUrl(id, animated, emoji.name ?? name);
        }),
      false,
    );
  }

  if (convertedEmojiIds.size > 0) {
    if (Array.isArray(message.invalidEmojis)) {
      message.invalidEmojis = message.invalidEmojis.filter(
        (entry: any) => !entry?.id || !convertedEmojiIds.has(String(entry.id)),
      );
    }
    if (Array.isArray(message.validNonShortcutEmojis)) {
      message.validNonShortcutEmojis = message.validNonShortcutEmojis.filter(
        (entry: any) => !entry?.id || !convertedEmojiIds.has(String(entry.id)),
      );
    }
  }

  if (appendedUrls.length > 0) {
    const existing = typeof message.content === 'string' ? message.content.trim() : '';
    message.content = existing ? `${existing} ${appendedUrls.join(' ')}` : appendedUrls.join(' ');
  }

  if (localConversions > 0) {
    console.log(`[Nekocord/FakeNitro] Converted ${localConversions} emoji(s)`);
  }

  const stickerHolders: Array<{ obj: Record<string, any>; prop: 'stickerIds' | 'sticker_ids' }> = [];
  for (const candidate of [message, arg2, arg3, arg4]) {
    if (!candidate || typeof candidate !== 'object') {
      continue;
    }
    if (Array.isArray(candidate.stickerIds) && candidate.stickerIds.length > 0) {
      stickerHolders.push({ obj: candidate, prop: 'stickerIds' });
    }
    if (Array.isArray(candidate.sticker_ids) && candidate.sticker_ids.length > 0) {
      stickerHolders.push({ obj: candidate, prop: 'sticker_ids' });
    }
  }

  if (stickerHolders.length === 0) {
    return;
  }

  const targetIds = stickerHolders[0].obj[stickerHolders[0].prop] as unknown[];
  const { urls, keepIds } = extractStickerUrlsFromIds(targetIds, channelId);
  if (urls.length === 0) {
    return;
  }

  console.log(`[Nekocord/FakeNitro] Converted ${urls.length} message sticker(s)`);
  const existing = typeof message.content === 'string' ? message.content.trim() : '';
  message.content = existing ? `${existing}\n${urls.join('\n')}` : urls.join('\n');

  for (let i = 0; i < stickerHolders.length; i += 1) {
    const { obj, prop } = stickerHolders[i];
    if (keepIds.length > 0) {
      obj[prop] = keepIds;
    } else {
      delete obj[prop];
    }
  }
}

function patchSendFunction(target: any, key: 'sendMessage' | '_sendMessage'): void {
  if (!target || typeof target[key] !== 'function' || !markPatchedMethod(target, key)) {
    return;
  }
  cleanups.push(
    before(target, key, (channelId: any, message: any, arg2?: any, arg3?: any, arg4?: any) => {
      processOutgoingMessage(String(channelId ?? ''), message, arg2, arg3, arg4);
    }),
  );
}

function patchMessageSending(actions: MessageActionCreators): void {
  cachedMessageActions = actions;
  console.log('[Nekocord/FakeNitro] Hooked MessageActions');
  patchStickerExportMethod(actions, 'sendStickers');
  patchStickerExportMethod(actions as Record<string, any>, 'sendSticker');
  patchStickerExportMethod(actions as Record<string, any>, 'sendGreetMessage');
  patchSendFunction(actions, 'sendMessage');
  patchSendFunction(actions as Record<string, any>, '_sendMessage');

  if (typeof actions.editMessage === 'function' && markPatchedMethod(actions, 'editMessage')) {
    cleanups.push(
      before(actions, 'editMessage', (channelId: any, _messageId: any, message: any) => {
        processOutgoingMessage(String(channelId ?? ''), message);
      }),
    );
  }
}

function patchMessageParserMod(mod: any): void {
  if (!mod || typeof mod.parse !== 'function' || !markPatchedMethod(mod, 'parse')) {
    return;
  }
  cleanups.push(
    after(mod, 'parse', (args: any[], res: any) => {
      if (res && typeof res === 'object') {
        const chId = String(
          args[0]?.id ?? args[0]?.channel_id ?? (typeof args[0] === 'string' ? args[0] : ''),
        );
        processOutgoingMessage(chId, res);
      }
      return res;
    }),
  );
  console.log('[Nekocord/FakeNitro] Hooked MessageParser.parse');
}

function patchUploadMod(mod: any): void {
  if (!mod || typeof mod.uploadFiles !== 'function' || !markPatchedMethod(mod, 'uploadFiles')) {
    return;
  }
  cleanups.push(
    before(mod, 'uploadFiles', (opts: any) => {
      if (opts && typeof opts === 'object' && opts.parsedMessage) {
        processOutgoingMessage(String(opts.channelId ?? ''), opts.parsedMessage);
      }
    }),
  );
  console.log('[Nekocord/FakeNitro] Hooked UploadActions.uploadFiles');
}

function patchHttpModule(httpMod: any): void {
  if (!httpMod || typeof httpMod.post !== 'function' || !markPatchedMethod(httpMod, 'post')) {
    return;
  }
  cleanups.push(
    before(httpMod, 'post', (reqOrUrl: any) => {
      if (!reqOrUrl || typeof reqOrUrl !== 'object' || typeof reqOrUrl.url !== 'string') {
        return;
      }
      const match = MESSAGES_POST_RE.exec(reqOrUrl.url);
      if (!match || !reqOrUrl.body || typeof reqOrUrl.body !== 'object') {
        return;
      }
      const channelId = match[1];
      const body = reqOrUrl.body as Record<string, any>;
      const prevContent = body.content;
      const hadStickers =
        (Array.isArray(body.sticker_ids) && body.sticker_ids.length > 0) ||
        (Array.isArray(body.stickerIds) && body.stickerIds.length > 0);
      processOutgoingMessage(channelId, body);
      if (hadStickers || body.content !== prevContent) {
        console.log(
          `[Nekocord/FakeNitro] HTTP.post sanitized /channels/${channelId}/messages (premium=${getUserPremiumType()}, stickersLeft=${Array.isArray(body.sticker_ids) ? body.sticker_ids.length : 0})`,
        );
      }
    }),
  );
  console.log('[Nekocord/FakeNitro] Hooked HTTP.post');
}

function handleMatchedTarget(hit: ComponentPatchTarget): void {
  const { target, key, matchedName } = hit;
  try {
    if (CAPABILITY_METHODS.has(matchedName)) {
      if (!markPatchedMethod(target, key)) return;
      const u: Unpatch = instead(
        target,
        key,
        function (this: any, args: any[], orig: (...a: any[]) => any) {
          if (bypassCapabilityOverride) {
            return orig.apply(this, args);
          }
          return true;
        },
      );
      cleanups.push(u);
      unlockedChecks += 1;
      if (unlockedChecks === 10 || unlockedChecks === 1) {
        console.log(`[Nekocord/FakeNitro] Unlocked ${unlockedChecks} Nitro capability checks`);
      }
      return;
    }

    if (matchedName === 'getEmojiUnavailableReason') {
      if (!markPatchedMethod(target, key)) return;
      if (!origGetEmojiUnavailableReason && typeof target[key] === 'function') {
        origGetEmojiUnavailableReason = target[key].bind(target);
      }
      const u: Unpatch = instead(
        target,
        key,
        function (this: any, args: any[], orig: (...a: any[]) => any) {
          if (bypassCapabilityOverride || isReactionIntention(args)) {
            return orig.apply(this, args);
          }
          return null;
        },
      );
      cleanups.push(u);
      pickerHooks += 1;
      console.log(`[Nekocord/FakeNitro] Hooked ${matchedName}`);
      return;
    }

    if (EMOJI_BOOL_LOCK_METHODS.has(matchedName)) {
      if (!markPatchedMethod(target, key)) return;
      if (typeof target[key] === 'function') {
        if (matchedName === 'isEmojiDisabled' && !origIsEmojiDisabled) {
          origIsEmojiDisabled = target[key].bind(target);
        } else if (matchedName === 'isEmojiPremiumLocked' && !origIsEmojiPremiumLocked) {
          origIsEmojiPremiumLocked = target[key].bind(target);
        } else if (matchedName === 'isEmojiFiltered' && !origIsEmojiFiltered) {
          origIsEmojiFiltered = target[key].bind(target);
        }
      }
      const u: Unpatch = instead(
        target,
        key,
        function (this: any, args: any[], orig: (...a: any[]) => any) {
          if (bypassCapabilityOverride || isReactionIntention(args)) {
            return orig.apply(this, args);
          }
          return false;
        },
      );
      cleanups.push(u);
      pickerHooks += 1;
      console.log(`[Nekocord/FakeNitro] Hooked ${matchedName}`);
      return;
    }

    if (CATEGORY_LOCK_METHODS.has(matchedName)) {
      if (!markPatchedMethod(target, key)) return;
      const u: Unpatch = instead(
        target,
        key,
        function (this: any, args: any[], orig: (...a: any[]) => any) {
          if (bypassCapabilityOverride) {
            return orig.apply(this, args);
          }
          return false;
        },
      );
      cleanups.push(u);
      pickerHooks += 1;
      console.log(`[Nekocord/FakeNitro] Hooked ${matchedName}`);
      return;
    }

    if (matchedName === 'getStickerSendability') {
      if (!markPatchedMethod(target, key)) return;
      if (!origGetStickerSendability && typeof target[key] === 'function') {
        origGetStickerSendability = target[key].bind(target);
      }
      const u: Unpatch = instead(
        target,
        key,
        function (this: any, args: any[], orig: (...a: any[]) => any) {
          if (bypassCapabilityOverride) {
            return orig.apply(this, args);
          }
          return 0;
        },
      );
      cleanups.push(u);
      pickerHooks += 1;
      console.log(`[Nekocord/FakeNitro] Hooked ${matchedName}`);
      return;
    }

    if (matchedName === 'isSendableSticker') {
      if (!markPatchedMethod(target, key)) return;
      if (!origIsSendableSticker && typeof target[key] === 'function') {
        origIsSendableSticker = target[key].bind(target);
      }
      const u: Unpatch = instead(
        target,
        key,
        function (this: any, args: any[], orig: (...a: any[]) => any) {
          if (bypassCapabilityOverride) {
            return orig.apply(this, args);
          }
          return true;
        },
      );
      cleanups.push(u);
      pickerHooks += 1;
      console.log(`[Nekocord/FakeNitro] Hooked ${matchedName}`);
      return;
    }

    if (
      matchedName === 'sendStickers' ||
      matchedName === 'sendSticker' ||
      matchedName === 'sendGreetMessage'
    ) {
      patchStickerExportMethod(target, matchedName);
      return;
    }

    if (matchedName === '_sendMessage') {
      patchSendFunction(target, '_sendMessage');
    }
  } catch (err) {
    console.error(`[Nekocord/FakeNitro] Failed to hook ${matchedName}:`, err);
  }
}

/**
 * Returns FakeNitro conversion, capability, and picker unlock telemetry.
 */
export function getFakeNitroStats(): {
  convertedCount: number;
  unlockedChecks: number;
  pickerHooks: number;
} {
  return { convertedCount, unlockedChecks, pickerHooks };
}

export default definePlugin({
  settings,
  start() {
    cleanups.push(watchNamedExports(FAKENITRO_TARGET_NAMES, handleMatchedTarget));
    cleanups.push(
      onMessageActions((actions) => {
        patchMessageSending(actions);
      }),
    );
    for (const actions of getModules<MessageActionCreators>(isMessageActions)) {
      patchMessageSending(actions);
    }

    const existingParser = findByProps('parse', 'parsePreprocessor');
    if (existingParser) {
      patchMessageParserMod(existingParser);
    } else {
      cleanups.push(
        waitFor(
          (m) =>
            typeof m === 'object' &&
            m !== null &&
            typeof m.parse === 'function' &&
            typeof m.parsePreprocessor === 'function',
          patchMessageParserMod,
        ),
      );
    }

    const existingInternalSend = findByProps('_sendMessage');
    if (existingInternalSend) {
      patchSendFunction(existingInternalSend, '_sendMessage');
    }

    const existingUpload = findByProps('uploadFiles');
    if (existingUpload) {
      patchUploadMod(existingUpload);
    } else {
      cleanups.push(
        waitFor(
          (m) => typeof m === 'object' && m !== null && typeof m.uploadFiles === 'function',
          patchUploadMod,
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

    cleanups.push(registerMessageRowTransformer(transformFakeNitroRow));
  },

  stop() {
    while (cleanups.length > 0) {
      const fn = cleanups.pop();
      fn?.();
    }
    origGetStickerSendability = null;
    origIsSendableSticker = null;
    origGetEmojiUnavailableReason = null;
    origIsEmojiDisabled = null;
    origIsEmojiPremiumLocked = null;
    origIsEmojiFiltered = null;
    cachedMessageActions = null;
    patchedMethods = new WeakMap<object, Set<string>>();
    bypassCapabilityOverride = false;
    unlockedChecks = 0;
    pickerHooks = 0;
  },
});
