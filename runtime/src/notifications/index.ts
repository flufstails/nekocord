import {
  getCacheModule,
  getChannelStore,
  getReactNative,
  getUserStore,
  onFluxDispatcher,
} from '../metro/common.js';
import { findByProps } from '../metro/index.js';
import { getNotificationSettings } from '../storage/index.js';

const NOTIF_STORAGE_KEY = 'nekocord:notifications:v1';
const MAX_NOTIFICATIONS = 150;
const DEDUP_WINDOW_MS = 2000;

export type NekocordNotificationKind = 'info' | 'success' | 'warning' | 'error' | 'discord';

export interface NekocordNotificationEntry {
  id: string;
  title: string;
  body: string;
  source: string;
  kind: NekocordNotificationKind;
  timestamp: number;
  channelId?: string;
  guildId?: string;
}

export interface PushNotificationInput {
  title: string;
  body: string;
  source?: string;
  kind?: NekocordNotificationKind;
  showToast?: boolean;
  channelId?: string;
  guildId?: string;
}

let initialized = false;
let seq = 0;
let entries: NekocordNotificationEntry[] = [];
const logListeners = new Set<() => void>();
const toastListeners = new Set<(entry: NekocordNotificationEntry) => void>();

function resolveCacheApi(): { getItem: (k: string) => Promise<string | null>; setItem: (k: string, v: string) => void } | null {
  try {
    const rn = getReactNative();
    const candidates = [
      getCacheModule(),
      rn?.TurboModuleRegistry?.get?.('NativeCacheModule'),
      rn?.NativeModules?.NativeCacheModule,
      findByProps('getItem', 'setItem', 'removeItem'),
    ];
    for (let i = 0; i < candidates.length; i += 1) {
      const c = candidates[i] as any;
      if (c && typeof c.getItem === 'function' && typeof c.setItem === 'function') {
        return c;
      }
    }
  } catch {
    // Ignore early startup errors.
  }
  return null;
}

function persistNotifications(): void {
  try {
    const cache = resolveCacheApi();
    cache?.setItem?.(NOTIF_STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_NOTIFICATIONS)));
  } catch {
    // Ignore storage write failures.
  }
}

function notifyLogListeners(): void {
  for (const fn of Array.from(logListeners)) {
    try {
      fn();
    } catch {
      // Ignore UI subscriber errors.
    }
  }
}

/**
 * Records a notification in the Nekocord Notification Log and optionally triggers an in-app toast.
 */
export function pushNotification(input: PushNotificationInput): NekocordNotificationEntry | null {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const body = typeof input.body === 'string' ? input.body.trim() : '';
  if (!title && !body) {
    return null;
  }

  const settings = getNotificationSettings();
  const source = (input.source ?? 'Nekocord').trim() || 'Nekocord';
  const kind: NekocordNotificationKind = input.kind ?? 'info';
  const now = Date.now();

  if (settings.enabled && entries.length > 0) {
    const top = entries[0];
    if (
      top.source === source &&
      top.title === title &&
      top.body === body &&
      now - top.timestamp < DEDUP_WINDOW_MS
    ) {
      return top;
    }
  }

  seq += 1;
  const entry: NekocordNotificationEntry = {
    id: `nc_${now}_${seq}`,
    title: title || source,
    body: body || title,
    source,
    kind,
    timestamp: now,
    ...(input.channelId ? { channelId: String(input.channelId) } : {}),
    ...(input.guildId ? { guildId: String(input.guildId) } : {}),
  };

  if (settings.enabled) {
    entries = [entry, ...entries].slice(0, MAX_NOTIFICATIONS);
    persistNotifications();
    notifyLogListeners();
  }

  const wantsToast = input.showToast !== false && settings.showToasts;
  if (wantsToast) {
    for (const toastCb of Array.from(toastListeners)) {
      try {
        toastCb(entry);
      } catch {
        // Ignore toast UI listener errors.
      }
    }
  }

  return entry;
}

export function getNotificationLog(): NekocordNotificationEntry[] {
  return [...entries];
}

export function deleteNotification(id: string): void {
  const next = entries.filter((item) => item.id !== id);
  if (next.length === entries.length) {
    return;
  }
  entries = next;
  persistNotifications();
  notifyLogListeners();
}

export function clearNotificationLog(): void {
  if (entries.length === 0) {
    return;
  }
  entries = [];
  persistNotifications();
  notifyLogListeners();
}

export const push = pushNotification;
export const getLog = getNotificationLog;
export const clear = clearNotificationLog;

export function subscribeNotifications(listener: () => void): () => void {
  logListeners.add(listener);
  return () => {
    logListeners.delete(listener);
  };
}

export function subscribeToasts(
  listener: (entry: NekocordNotificationEntry) => void,
): () => void {
  toastListeners.add(listener);
  return () => {
    toastListeners.delete(listener);
  };
}

function formatAuthorName(msg: Record<string, any>): string {
  const author = msg?.author;
  if (!author || typeof author !== 'object') {
    return 'Someone';
  }
  return (
    (typeof author.globalName === 'string' && author.globalName) ||
    (typeof author.username === 'string' && author.username) ||
    'Someone'
  );
}

function handleMessageCreate(action: Record<string, any>): void {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.captureMentions) {
    return;
  }
  const msg = action.message;
  if (!msg || typeof msg !== 'object') {
    return;
  }
  const currentUser = getUserStore()?.getCurrentUser?.();
  const selfId = currentUser?.id ? String(currentUser.id) : '';
  const authorId = msg.author?.id ? String(msg.author.id) : '';
  if (selfId && authorId === selfId) {
    return;
  }

  const channelId = msg.channel_id ? String(msg.channel_id) : '';
  const channel = channelId ? getChannelStore()?.getChannel?.(channelId) : null;
  const isDm = !msg.guild_id && (!channel || channel.type === 1 || channel.type === 3);
  const mentionedMe =
    Boolean(selfId) &&
    ((Array.isArray(msg.mentions) && msg.mentions.some((u: any) => String(u?.id) === selfId)) ||
      (typeof msg.content === 'string' &&
        (msg.content.indexOf(`<@${selfId}>`) !== -1 ||
          msg.content.indexOf(`<@!${selfId}>`) !== -1)));

  if (!isDm && !mentionedMe) {
    return;
  }

  const authorName = formatAuthorName(msg);
  const rawBody = typeof msg.content === 'string' && msg.content.trim()
    ? msg.content.trim()
    : 'Sent an attachment or embed';
  const snippet = rawBody.length > 160 ? `${rawBody.slice(0, 157)}...` : rawBody;

  pushNotification({
    title: isDm ? `Direct Message from ${authorName}` : `Mention from ${authorName}`,
    body: snippet,
    source: 'Discord',
    kind: 'discord',
    showToast: false,
    ...(channelId ? { channelId } : {}),
    ...(msg.guild_id ? { guildId: String(msg.guild_id) } : {}),
  });
}

function handleRelationshipEvent(action: Record<string, any>): void {
  const settings = getNotificationSettings();
  if (!settings.enabled || !settings.captureRelationships) {
    return;
  }
  const rel = action.relationship;
  if (!rel || typeof rel !== 'object') {
    return;
  }
  const userId = rel.id ? String(rel.id) : '';
  const user = userId ? getUserStore()?.getUser?.(userId) : null;
  const userName = user?.globalName || user?.username || (userId ? `User ${userId}` : 'A user');

  if (action.type === 'RELATIONSHIP_ADD' && rel.type === 3) {
    pushNotification({
      title: 'Incoming Friend Request',
      body: `${userName} sent you a friend request.`,
      source: 'Relationships',
      kind: 'discord',
      showToast: false,
    });
  } else if (action.type === 'RELATIONSHIP_REMOVE' && rel.type === 1) {
    pushNotification({
      title: 'Friend Removed',
      body: `${userName} is no longer on your friends list.`,
      source: 'Relationships',
      kind: 'warning',
      showToast: true,
    });
  }
}

/**
 * Hydrates saved notification history and subscribes to live Discord mention/relationship events.
 */
export function initNotificationLog(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  const cache = resolveCacheApi();
  cache
    ?.getItem(NOTIF_STORAGE_KEY)
    .then((raw) => {
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const loaded = parsed.filter(
        (item): item is NekocordNotificationEntry =>
          Boolean(
            item &&
              typeof item === 'object' &&
              typeof item.id === 'string' &&
              typeof item.title === 'string' &&
              typeof item.timestamp === 'number',
          ),
      );
      if (loaded.length > 0) {
        const existingIds = new Set(entries.map((e) => e.id));
        entries = [...entries, ...loaded.filter((e) => !existingIds.has(e.id))]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_NOTIFICATIONS);
        notifyLogListeners();
      }
    })
    .catch(() => {
      // Ignore notification hydration errors.
    });

  onFluxDispatcher((dispatcher) => {
    dispatcher.subscribe('MESSAGE_CREATE', handleMessageCreate);
    dispatcher.subscribe('RELATIONSHIP_ADD', handleRelationshipEvent);
    dispatcher.subscribe('RELATIONSHIP_REMOVE', handleRelationshipEvent);
  });
}
