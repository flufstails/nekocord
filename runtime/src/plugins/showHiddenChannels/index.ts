import { getChannelStore, getReactNative, getStore, interceptFluxDispatcher } from '../../metro/common.js';
import { findByProps, waitFor, waitForStore } from '../../metro/index.js';
import { pushNotification } from '../../notifications/index.js';
import { after, instead, type Unpatch } from '../../patcher/index.js';
import { pad2, snowflakeToEpochMs } from '../_shared/chatDisplay.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const OBFUSCATED_FLAG = 131072; // 1 << 17
const CHANNEL_ROUTE_RE = /^\/channels\/([^/?]+)\/([^/?]+)(?:\/|$|\?)/;

const settings = definePluginSettings({
  showChannelInfoPopup: {
    type: OptionType.BOOLEAN,
    label: 'Show Info Dialog on Tap',
    description: 'Open channel details in a popup instead of a blank screen when tapping a locked channel.',
    default: true,
  },
  labelObfuscatedChannels: {
    type: OptionType.BOOLEAN,
    label: 'Descriptive Locked Names',
    description: 'Show channel type and short ID instead of identical "No Access" labels.',
    default: true,
  },
});

const cleanups: Array<() => void> = [];
const patchedProtoSet = new WeakSet<object>();
const mutatedChannels = new Set<any>();
let bypassPermOverride = false;
let lastPromptChannelId = '';
let lastPromptAt = 0;

function isViewChannelPerm(perm: unknown): boolean {
  if (typeof perm === 'bigint') {
    const bit = BigInt(1024);
    return (perm & bit) === bit;
  }
  if (typeof perm === 'number') {
    return (perm & 0x400) === 0x400;
  }
  return false;
}

function getChannelFlags(channel: any): number {
  return Number(channel?.flags ?? channel?.flags_ ?? 0) || 0;
}

function isServerObfuscated(channel: any): boolean {
  if (!channel || typeof channel !== 'object') return false;
  if (channel.__nekocordObfuscated === true) return true;
  if (channel.name === '___hidden___') return true;
  if ((getChannelFlags(channel) & OBFUSCATED_FLAG) !== 0) return true;
  return false;
}

function patchChannelIsObfuscatedProto(channel: any): void {
  if (!channel || typeof channel !== 'object') return;
  try {
    let proto = Object.getPrototypeOf(channel);
    while (proto && proto !== Object.prototype) {
      if (!patchedProtoSet.has(proto) && typeof proto.isObfuscated === 'function') {
        patchedProtoSet.add(proto);
        const u: Unpatch = instead(proto, 'isObfuscated', function (
          this: any,
          args: any[],
          orig: (...a: any[]) => any,
        ) {
          if (settings.store.labelObfuscatedChannels) {
            return false;
          }
          return orig.apply(this, args);
        });
        cleanups.push(u);
      }
      proto = Object.getPrototypeOf(proto);
    }
  } catch {
    // Ignore locked prototype chains.
  }
}

function prepareHiddenChannelForDisplay(channel: any): void {
  if (!channel || typeof channel !== 'object' || !channel.guild_id) return;
  patchChannelIsObfuscatedProto(channel);
  if (!isServerObfuscated(channel)) return;
  channel.__nekocordObfuscated = true;
  if (!settings.store.labelObfuscatedChannels) return;
  if (channel.name === '___hidden___' || channel.name === 'No Access') {
    if (channel.__nekocordOrigName === undefined) {
      channel.__nekocordOrigName = channel.name;
    }
    try {
      channel.name = buildDescriptiveLockedName(channel);
      mutatedChannels.add(channel);
    } catch {
      // Skip frozen channel records.
    }
  }
}

function realCanBasicView(channel: any): boolean {
  const permStore = getStore<any>('PermissionStore');
  if (!permStore || !channel) return true;
  bypassPermOverride = true;
  try {
    const bit = typeof BigInt === 'function' ? BigInt(1024) : 1024;
    if (typeof permStore.canBasicChannel === 'function') {
      return Boolean(permStore.canBasicChannel(bit, channel));
    }
    if (typeof permStore.can === 'function') {
      return Boolean(permStore.can(bit, channel));
    }
  } catch {
    try {
      return Boolean(permStore.can?.(1024, channel));
    } catch {
      return true;
    }
  } finally {
    bypassPermOverride = false;
  }
  return true;
}

function isHiddenGuildChannel(channel: any): boolean {
  if (!channel || typeof channel !== 'object' || !channel.guild_id) {
    return false;
  }
  if (isServerObfuscated(channel)) {
    return true;
  }
  return !realCanBasicView(channel);
}

function getChannelTypeLabel(type: unknown): string {
  switch (Number(type)) {
    case 0:
      return 'Text';
    case 2:
      return 'Voice';
    case 4:
      return 'Category';
    case 5:
      return 'Announcement';
    case 13:
      return 'Stage';
    case 15:
      return 'Forum';
    case 16:
      return 'Media';
    default:
      return `Type ${String(type ?? 0)}`;
  }
}

function buildDescriptiveLockedName(channel: any, fallbackName?: string): string {
  const id = String(channel?.id ?? '');
  const shortId = id.length >= 4 ? id.slice(-4) : id || '0000';
  const rawName = typeof channel?.name === 'string' ? channel.name : '';

  if (
    rawName &&
    rawName !== '___hidden___' &&
    rawName !== 'No Access' &&
    (channel.__nekocordObfuscated || (getChannelFlags(channel) & OBFUSCATED_FLAG) === 0)
  ) {
    return rawName.indexOf('🔒') === 0 ? rawName : `🔒 ${rawName}`;
  }
  if (!settings.store.labelObfuscatedChannels) {
    return fallbackName || 'No Access';
  }

  switch (Number(channel?.type)) {
    case 4:
      return `🔒 Hidden Category #${shortId}`;
    case 2:
      return `🔒 hidden-voice-${shortId}`;
    case 13:
      return `🔒 hidden-stage-${shortId}`;
    case 15:
      return `🔒 hidden-forum-${shortId}`;
    case 16:
      return `🔒 hidden-media-${shortId}`;
    case 5:
      return `🔒 hidden-news-${shortId}`;
    default:
      return `🔒 hidden-text-${shortId}`;
  }
}

function findFirstAccessibleChannelId(guildId: string): string | null {
  const chStore = getChannelStore<any>();
  if (!chStore || typeof chStore.getMutableGuildChannelsForGuild !== 'function') {
    return null;
  }
  try {
    const channels = Object.values(chStore.getMutableGuildChannelsForGuild(guildId) ?? {}) as any[];
    channels.sort((a, b) => Number(a?.position_ ?? a?.position ?? 0) - Number(b?.position_ ?? b?.position ?? 0));
    for (let i = 0; i < channels.length; i += 1) {
      const ch = channels[i];
      if (!ch || !ch.id || Number(ch.type) === 4) continue;
      if (!isHiddenGuildChannel(ch)) {
        return String(ch.id);
      }
    }
  } catch {
    // Ignore store enumeration errors.
  }
  return null;
}

function formatLastActivity(lastMessageId: unknown): string {
  const ts = snowflakeToEpochMs(typeof lastMessageId === 'string' ? lastMessageId : String(lastMessageId ?? ''));
  if (!ts) return 'Unknown';
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function showHiddenChannelInfo(channel: any): void {
  const id = String(channel?.id ?? '');
  const now = Date.now();
  if (id && id === lastPromptChannelId && now - lastPromptAt < 800) {
    return;
  }
  lastPromptChannelId = id;
  lastPromptAt = now;

  const chStore = getChannelStore<any>();
  const guildStore = getStore<any>('GuildStore');
  const guildName = guildStore?.getGuild?.(channel.guild_id)?.name ?? String(channel.guild_id);
  const parentName = channel.parent_id ? chStore?.getChannel?.(channel.parent_id)?.name : '';
  const obfuscated = isServerObfuscated(channel);
  const label = buildDescriptiveLockedName(channel);
  const topic = String(channel.topic ?? channel.topic_ ?? '').trim();
  const slowmode = Number(channel.rateLimitPerUser_ ?? channel.rateLimitPerUser ?? 0) || 0;
  const nsfw = Boolean(channel.nsfw_ ?? channel.nsfw);
  const overwrites = channel.permissionOverwrites ?? channel.permissionOverwrites_;
  const overwriteCount = overwrites && typeof overwrites === 'object' ? Object.keys(overwrites).length : 0;
  const lastMsg = formatLastActivity(channel.lastMessageId);

  const lines = [
    `Server: ${guildName}`,
    `Type: ${getChannelTypeLabel(channel.type)}${nsfw ? ' (NSFW)' : ''}`,
    `Category: ${parentName && parentName !== '___hidden___' ? parentName : obfuscated ? 'Hidden by server' : 'None'}`,
    `Last Activity: ${lastMsg}`,
    `Overwrites: ${overwriteCount} role/member rule(s)`,
  ];
  if (slowmode > 0) {
    lines.push(`Slowmode: ${slowmode}s`);
  }
  if (topic) {
    lines.push(`Topic: ${topic}`);
  } else if (obfuscated) {
    lines.push('Note: Discord withheld the channel name and topic server-side.');
  }

  pushNotification({
    title: `Locked Channel: ${label}`,
    body: lines.slice(0, 3).join(' • '),
    source: 'ShowHiddenChannels',
    kind: 'info',
    channelId: id,
    showToast: !settings.store.showChannelInfoPopup,
  });

  if (settings.store.showChannelInfoPopup) {
    const Alert = getReactNative()?.Alert;
    if (Alert && typeof Alert.alert === 'function') {
      Alert.alert(label, lines.join('\n'), [{ text: 'OK' }]);
    }
  }
}

function patchPermissionStore(store: any): void {
  if (!store) return;

  const wrapPermCheck = (target: any, key: 'can' | 'canBasicChannel') => {
    if (!target || typeof target[key] !== 'function') return;
    try {
      const u: Unpatch = after(target, key, (args: any[], res: any) => {
        if (bypassPermOverride) return res;
        const [perm, channel] = args;
        if (channel && typeof channel === 'object' && channel.guild_id) {
          prepareHiddenChannelForDisplay(channel);
        }
        if (res === true) return res;
        if (!isViewChannelPerm(perm)) return res;
        if (channel && typeof channel === 'object' && channel.guild_id) {
          return true;
        }
        return res;
      });
      cleanups.push(u);
    } catch {
      // Skip non-writable store methods.
    }
  };

  wrapPermCheck(store, 'can');
  const proto = Object.getPrototypeOf(store);
  if (proto && proto !== Object.prototype) {
    wrapPermCheck(proto, 'canBasicChannel');
  }
}

function patchChannelNameModule(mod: any): void {
  if (!mod || typeof mod.computeChannelName !== 'function') return;
  try {
    const u: Unpatch = after(mod, 'computeChannelName', (args: any[], res: any) => {
      const ch = args[0];
      if (!ch || typeof ch !== 'object' || !ch.guild_id) {
        return res;
      }
      prepareHiddenChannelForDisplay(ch);
      if (!isHiddenGuildChannel(ch)) {
        return res;
      }
      if (isServerObfuscated(ch) || res === 'No Access' || res === '___hidden___') {
        return buildDescriptiveLockedName(ch, typeof res === 'string' ? res : undefined);
      }
      return res;
    });
    cleanups.push(u);
  } catch {
    // Ignore locked computeChannelName export.
  }
}

function patchChannelStoreForObfuscation(chStore: any): void {
  if (!chStore) return;
  const proto = Object.getPrototypeOf(chStore);
  const targets = proto && proto !== Object.prototype ? [chStore, proto] : [chStore];
  for (const target of targets) {
    for (const fn of ['getChannel', 'getBasicChannel'] as const) {
      if (typeof target[fn] !== 'function') continue;
      try {
        cleanups.push(
          after(target, fn, (_args: any[], ch: any) => {
            if (ch && typeof ch === 'object' && ch.guild_id) {
              prepareHiddenChannelForDisplay(ch);
            }
            return ch;
          }),
        );
      } catch {
        // Skip locked methods.
      }
    }
    for (const fn of ['getMutableGuildChannelsForGuild', 'getMutableBasicGuildChannelsForGuild'] as const) {
      if (typeof target[fn] !== 'function') continue;
      try {
        cleanups.push(
          after(target, fn, (_args: any[], map: any) => {
            if (map && typeof map === 'object') {
              const values = Object.values(map);
              for (let i = 0; i < values.length; i += 1) {
                prepareHiddenChannelForDisplay(values[i]);
              }
            }
            return map;
          }),
        );
      } catch {
        // Skip locked methods.
      }
    }
  }
}

function patchNavigationModule(nav: any): void {
  if (!nav) return;
  for (const method of ['transitionTo', 'replaceWith'] as const) {
    if (typeof nav[method] !== 'function') continue;
    try {
      const u: Unpatch = instead(nav, method, function (this: any, args: any[], orig: (...a: any[]) => any) {
        const route = typeof args[0] === 'string' ? args[0] : '';
        const opts = args[1] && typeof args[1] === 'object' ? args[1] : undefined;
        const m = CHANNEL_ROUTE_RE.exec(route);
        if (m) {
          const [, guildId, channelId] = m;
          const ch = getChannelStore<any>()?.getChannel?.(channelId);
          if (ch && isHiddenGuildChannel(ch)) {
            if (!opts?.openChannel) {
              const fallbackId = findFirstAccessibleChannelId(guildId);
              if (fallbackId) {
                const nextArgs = args.slice();
                nextArgs[0] = `/channels/${guildId}/${fallbackId}`;
                return orig.apply(this, nextArgs);
              }
            }
            showHiddenChannelInfo(ch);
            return undefined;
          }
        }
        return orig.apply(this, args);
      });
      cleanups.push(u);
    } catch {
      // Ignore locked navigation helpers.
    }
  }
}

export default definePlugin({
  settings,
  start() {
    if (cleanups.length > 0) return;

    const existingPerm = getStore<any>('PermissionStore');
    if (existingPerm) {
      patchPermissionStore(existingPerm);
    } else {
      cleanups.push(waitForStore('PermissionStore', patchPermissionStore));
    }

    const existingChStore = getChannelStore<any>();
    if (existingChStore) {
      patchChannelStoreForObfuscation(existingChStore);
    } else {
      cleanups.push(waitForStore('ChannelStore', patchChannelStoreForObfuscation));
    }

    const existingNameMod = findByProps('computeChannelName');
    if (existingNameMod) {
      patchChannelNameModule(existingNameMod);
    } else {
      cleanups.push(
        waitFor((m) => m && typeof m === 'object' && typeof m.computeChannelName === 'function', patchChannelNameModule),
      );
    }

    const existingNav = findByProps('transitionToGuild', 'transitionTo');
    if (existingNav) {
      patchNavigationModule(existingNav);
    } else {
      cleanups.push(
        waitFor(
          (m) => m && typeof m === 'object' && typeof m.transitionTo === 'function' && typeof m.transitionToGuild === 'function',
          patchNavigationModule,
        ),
      );
    }

    cleanups.push(
      interceptFluxDispatcher((action, args, orig) => {
        if (action.type === 'CHANNEL_SELECT' && action.channelId && action.guildId) {
          const ch = getChannelStore<any>()?.getChannel?.(String(action.channelId));
          if (ch && isHiddenGuildChannel(ch) && Number(ch.type) !== 2 && Number(ch.type) !== 13) {
            if (action.opensChannel === false) {
              const fallbackId = findFirstAccessibleChannelId(String(action.guildId));
              if (fallbackId) {
                action.channelId = fallbackId;
                return orig(...args);
              }
            }
            showHiddenChannelInfo(ch);
            return undefined;
          }
        }
        return orig(...args);
      }),
    );
  },

  stop() {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
    mutatedChannels.forEach((ch) => {
      try {
        if (ch.__nekocordOrigName !== undefined) {
          ch.name = ch.__nekocordOrigName;
          delete ch.__nekocordOrigName;
        }
      } catch {
        // Ignore frozen channels on unload.
      }
    });
    mutatedChannels.clear();
    bypassPermOverride = false;
  },
});
