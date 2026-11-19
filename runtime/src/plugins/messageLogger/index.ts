import { isChatRowHookReady, registerMessageRowTransformer, toAndroidColor } from '../../chat/rows.js';
import {
  getChannelStore,
  getMessageStore,
  getThemeStore,
  getUserStore,
  interceptFluxDispatcher,
  onMessageActions,
} from '../../metro/common.js';
import { before, type Unpatch } from '../../patcher/index.js';
import { extractMessageText } from '../_shared/chatDisplay.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  logDeletes: {
    type: OptionType.BOOLEAN,
    label: 'Keep Deleted Messages',
    description: 'Keep deleted messages visible in chat marked as deleted.',
    default: true,
  },
  logEdits: {
    type: OptionType.BOOLEAN,
    label: 'Keep Message Edits',
    description: 'Show older versions of messages above edited text.',
    default: true,
  },
  ignoreBots: {
    type: OptionType.BOOLEAN,
    label: 'Ignore Bots',
    description: 'Do not save edits or deleted messages from bots.',
    default: false,
  },
  ignoreSelf: {
    type: OptionType.BOOLEAN,
    label: 'Ignore Own Messages',
    description: 'Do not save edits or deletions for your own messages.',
    default: false,
  },
});

interface DeletedRecord {
  channelId: string;
  deletedAt: number;
}

interface EditRevision {
  content: string;
  timestamp: number;
}

interface CachedRowSnapshot {
  channelId: string;
  content: string;
  authorId?: string;
  bot?: boolean;
}

const MAX_TRACKED_MESSAGES = 500;
const MAX_CACHED_ROWS = 800;
const MAX_REVISIONS_PER_MESSAGE = 10;
const DUPLICATE_DELETE_WINDOW_MS = 3000;
const SENTINEL = '\u200b';
const SENTINEL_TAIL_RE = /(?:\u200b ?)+$/g;
const EPHEMERAL_FLAG = 64;

const deletedMessages = new Map<string, DeletedRecord>();
const editHistory = new Map<string, EditRevision[]>();
const renderedRowCache = new Map<string, CachedRowSnapshot>();

let stopIntercept: (() => void) | null = null;
let cancelActionsWait: (() => void) | null = null;
let unpatchEditAction: Unpatch | null = null;
let unregisterRowTransformer: (() => void) | null = null;

function setWithCap<K, V>(map: Map<K, V>, key: K, value: V, cap: number): void {
  if (!map.has(key) && map.size >= cap) {
    const oldest = map.keys().next().value;
    if (oldest !== undefined) {
      map.delete(oldest);
    }
  }
  map.set(key, value);
}

function stripSentinel(text: string): string {
  return text.replace(SENTINEL_TAIL_RE, '');
}

function getMessageFromStore(channelId: string, id: string): any {
  const store = getMessageStore();
  if (!store) {
    return undefined;
  }
  try {
    if (typeof store.getMessage === 'function') {
      const msg = store.getMessage(channelId, id);
      if (msg) {
        return msg;
      }
    }
    if (typeof store.getMessages === 'function') {
      const collection = store.getMessages(channelId);
      return collection?.get?.(id) ?? collection?._map?.[id] ?? collection?.[id];
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function shouldSkipMessage(msg: any): boolean {
  if (!msg || typeof msg !== 'object') {
    return true;
  }
  if (msg.state === 'SENDING' || msg.state === 'SEND_FAILED') {
    return true;
  }
  if (typeof msg.flags === 'number' && (msg.flags & EPHEMERAL_FLAG) !== 0) {
    return true;
  }
  if (settings.store.ignoreBots && Boolean(msg.author?.bot || msg.webhook_id || msg.webhookId)) {
    return true;
  }
  if (settings.store.ignoreSelf) {
    const meId = getUserStore()?.getCurrentUser?.()?.id;
    const authorId = msg.author?.id ?? msg.author_id;
    if (meId && authorId && String(authorId) === String(meId)) {
      return true;
    }
  }
  return false;
}

function formatIsoTimestamp(ts: unknown): string | undefined {
  if (typeof ts === 'string' && ts.length > 0) {
    return ts;
  }
  if (typeof ts === 'number' && Number.isFinite(ts) && ts > 0) {
    return new Date(ts).toISOString();
  }
  if (ts && typeof ts === 'object' && typeof (ts as { toISOString?: unknown }).toISOString === 'function') {
    try {
      return (ts as { toISOString: () => string }).toISOString();
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function isValidSnowflake(value: unknown): value is string {
  return typeof value === 'string' && /^\d+$/.test(value);
}

function serializeAuthor(existing: any): Record<string, any> | undefined {
  const rawAuthor = existing?.author;
  const candidateId = isValidSnowflake(rawAuthor?.id)
    ? rawAuthor.id
    : isValidSnowflake(existing?.authorId)
      ? existing.authorId
      : isValidSnowflake(existing?.author_id)
        ? existing.author_id
        : undefined;
  const storeUser = candidateId ? getUserStore()?.getUser?.(candidateId) : undefined;
  const src = storeUser ?? rawAuthor;
  const id = isValidSnowflake(src?.id) ? src.id : candidateId;
  if (!id) {
    return undefined;
  }
  const username =
    typeof src?.username === 'string' && src.username.length > 0 && src.username !== '???'
      ? src.username
      : 'Unknown User';
  const discriminator =
    typeof src?.discriminator === 'string' && /^\d{1,4}$/.test(src.discriminator)
      ? src.discriminator
      : '0';
  const rawDec = src?.avatarDecorationData ?? src?.avatar_decoration_data;
  const avatarDecorationData =
    rawDec && typeof rawDec === 'object' && typeof rawDec.asset === 'string'
      ? { asset: rawDec.asset, sku_id: rawDec.skuId ?? rawDec.sku_id ?? null }
      : null;

  return {
    id,
    username,
    discriminator,
    global_name: src?.globalName ?? src?.global_name ?? null,
    avatar: typeof src?.avatar === 'string' ? src.avatar : null,
    bot: Boolean(src?.bot ?? existing?.bot),
    system: Boolean(src?.system),
    public_flags:
      typeof src?.publicFlags === 'number'
        ? src.publicFlags
        : typeof src?.public_flags === 'number'
          ? src.public_flags
          : 0,
    avatar_decoration_data: avatarDecorationData,
  };
}

function buildSyntheticMessageUpdate(
  existing: any,
  channelId: string,
  id: string,
  guildId?: unknown,
  fromStore?: boolean,
): Record<string, any> {
  const baseContent = typeof existing.content === 'string' ? existing.content : '';
  const nextContent = baseContent.endsWith(SENTINEL) ? `${baseContent} ` : `${baseContent}${SENTINEL}`;

  const message: Record<string, any> = {
    id,
    channel_id: channelId,
    content: nextContent,
  };

  if (typeof existing.type === 'number') {
    message.type = existing.type;
  } else if (!fromStore) {
    message.type = 0;
  }

  const tsIso = formatIsoTimestamp(existing.timestamp);
  if (tsIso !== undefined) {
    message.timestamp = tsIso;
  } else if (!fromStore) {
    message.timestamp = new Date().toISOString();
  }

  const author = serializeAuthor(existing);
  if (author) {
    message.author = author;
  }

  const webhookId = existing.webhookId ?? existing.webhook_id;
  if (webhookId) {
    message.webhook_id = String(webhookId);
  }

  if (!fromStore) {
    message.tts = Boolean(existing.tts);
    message.pinned = Boolean(existing.pinned);
    message.mention_everyone = Boolean(existing.mentionEveryone ?? existing.mention_everyone);
    message.mentions = [];
    message.mention_roles = [];
    message.attachments = Array.isArray(existing.attachments) ? existing.attachments : [];
    message.embeds = Array.isArray(existing.embeds) ? existing.embeds : [];
  }

  const editedIso = formatIsoTimestamp(existing.editedTimestamp ?? existing.edited_timestamp);
  if (editedIso !== undefined) {
    message.edited_timestamp = editedIso;
  }

  const resolvedGuildId = guildId ?? existing.guild_id ?? getChannelStore()?.getChannel?.(channelId)?.guild_id;
  const out: Record<string, any> = {
    type: 'MESSAGE_UPDATE',
    message,
    __purrcordSynthetic: true,
  };
  if (resolvedGuildId) {
    out.guildId = String(resolvedGuildId);
  }
  return out;
}

function recordEditRevision(id: string, prevContent: string): void {
  const list = editHistory.get(id) ?? [];
  const last = list[list.length - 1];
  if (last && last.content === prevContent) {
    return;
  }
  list.push({ content: prevContent, timestamp: Date.now() });
  if (list.length > MAX_REVISIONS_PER_MESSAGE) {
    list.splice(0, list.length - MAX_REVISIONS_PER_MESSAGE);
  }
  setWithCap(editHistory, id, list, MAX_TRACKED_MESSAGES);
  console.log(`[Nekocord/MessageLogger] Recorded edit for ${id} (revisions=${list.length})`);
}

function getMessageFromStoreOrCache(channelId: string, id: string): any {
  const fromStore = getMessageFromStore(channelId, id);
  if (fromStore) {
    return fromStore;
  }
  const cached = renderedRowCache.get(id);
  if (cached && (!channelId || cached.channelId === channelId)) {
    return {
      id,
      channel_id: cached.channelId,
      content: cached.content,
      author: { id: cached.authorId, bot: cached.bot },
    };
  }
  return undefined;
}

function getActionChannelId(action: Record<string, any>): string {
  return String(action.channelId ?? action.channel_id ?? action.message?.channel_id ?? action.message?.channelId ?? '');
}

function handleMessageUpdateDispatch(action: Record<string, any>): void {
  if (action.__purrcordSynthetic) {
    return;
  }
  const rawMsg = action.message;
  const id = rawMsg?.id ? String(rawMsg.id) : '';
  const channelId = rawMsg ? String(rawMsg.channel_id ?? rawMsg.channelId ?? action.channelId ?? '') : '';
  if (!id || !channelId || typeof rawMsg.content !== 'string') {
    return;
  }

  const storeMsg = getMessageFromStore(channelId, id);
  const cached = renderedRowCache.get(id);
  const prev = storeMsg ?? getMessageFromStoreOrCache(channelId, id);
  if (prev && shouldSkipMessage(prev)) {
    return;
  }

  const nextClean = stripSentinel(rawMsg.content);
  const storePrev = typeof storeMsg?.content === 'string' ? stripSentinel(storeMsg.content) : '';
  const cachePrev = cached && (!channelId || cached.channelId === channelId) ? stripSentinel(cached.content) : '';

  const prevContent =
    storePrev && storePrev !== nextClean
      ? storePrev
      : cachePrev && cachePrev !== nextClean
        ? cachePrev
        : '';

  if (prevContent.length > 0) {
    recordEditRevision(id, prevContent);
  }
  renderedRowCache.set(id, {
    channelId,
    content: nextClean,
    authorId: prev?.author?.id ? String(prev.author.id) : cached?.authorId,
    bot: Boolean(prev?.author?.bot ?? cached?.bot),
  });
}

function handleMessageDelete(
  action: Record<string, any>,
  orig: (...args: any[]) => any,
  args: any[],
): any {
  if (action.__purrcordBypass) {
    return orig(...args);
  }
  const id = action.id ? String(action.id) : '';
  const channelId = getActionChannelId(action);
  if (!id || !channelId) {
    return orig(...args);
  }

  const storeMsg = getMessageFromStore(channelId, id);
  const fromStore = Boolean(storeMsg);
  const existing = storeMsg ?? getMessageFromStoreOrCache(channelId, id);
  if (!existing || shouldSkipMessage(existing)) {
    console.log(
      `[Nekocord/MessageLogger] MESSAGE_DELETE id=${id} channel=${channelId} found=${Boolean(existing)} fromStore=${fromStore} skipped=true hookReady=${isChatRowHookReady()}`,
    );
    return orig(...args);
  }

  const prevDeleted = deletedMessages.get(id);
  if (prevDeleted) {
    if (Date.now() - prevDeleted.deletedAt < DUPLICATE_DELETE_WINDOW_MS) {
      return undefined;
    }
    deletedMessages.delete(id);
    editHistory.delete(id);
    return orig(...args);
  }

  const synthetic = buildSyntheticMessageUpdate(existing, channelId, id, action.guildId, fromStore);
  console.log(
    `[Nekocord/MessageLogger] MESSAGE_DELETE id=${id} channel=${channelId} found=true fromStore=${fromStore} authorId=${synthetic.message.author?.id ?? 'none'} hookReady=${isChatRowHookReady()}`,
  );
  if (!fromStore && !synthetic.message.author) {
    return orig(...args);
  }

  setWithCap(deletedMessages, id, { channelId, deletedAt: Date.now() }, MAX_TRACKED_MESSAGES);
  return orig(synthetic, ...args.slice(1));
}

function handleMessageDeleteBulk(
  action: Record<string, any>,
  orig: (...args: any[]) => any,
  args: any[],
): any {
  if (action.__purrcordBypass) {
    return orig(...args);
  }
  const channelId = getActionChannelId(action);
  const ids = Array.isArray(action.ids) ? action.ids : [];
  if (!channelId || ids.length === 0) {
    return orig(...args);
  }

  const remainingIds: any[] = [];
  for (let i = 0; i < ids.length; i += 1) {
    const rawId = ids[i];
    const id = String(rawId);
    if (deletedMessages.has(id)) {
      continue;
    }
    const storeMsg = getMessageFromStore(channelId, id);
    const fromStore = Boolean(storeMsg);
    const existing = storeMsg ?? getMessageFromStoreOrCache(channelId, id);
    if (!existing || shouldSkipMessage(existing)) {
      remainingIds.push(rawId);
      continue;
    }
    const synthetic = buildSyntheticMessageUpdate(existing, channelId, id, action.guildId, fromStore);
    if (!fromStore && !synthetic.message.author) {
      remainingIds.push(rawId);
      continue;
    }
    setWithCap(deletedMessages, id, { channelId, deletedAt: Date.now() }, MAX_TRACKED_MESSAGES);
    orig(synthetic, ...args.slice(1));
  }

  if (remainingIds.length === 0) {
    return undefined;
  }
  if (remainingIds.length === ids.length) {
    return orig(...args);
  }
  return orig({ ...action, ids: remainingIds }, ...args.slice(1));
}

function extractNodeText(node: unknown): string {
  if (typeof node === 'string') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(extractNodeText).join('');
  }
  if (node && typeof node === 'object') {
    const content = (node as { content?: unknown }).content;
    return content !== undefined ? extractNodeText(content) : '';
  }
  return '';
}

function stripTailSentinelFromNodes(nodes: any[]): any[] {
  if (nodes.length === 0) {
    return nodes;
  }
  const cloned = nodes.slice();
  const lastIdx = cloned.length - 1;
  const last = cloned[lastIdx];
  if (typeof last === 'string') {
    cloned[lastIdx] = stripSentinel(last);
    return cloned;
  }
  if (!last || typeof last !== 'object') {
    return cloned;
  }
  if (last.type === 'text' && typeof last.content === 'string') {
    cloned[lastIdx] = { ...last, content: stripSentinel(last.content) };
    return cloned;
  }
  if (Array.isArray(last.content)) {
    cloned[lastIdx] = { ...last, content: stripTailSentinelFromNodes(last.content) };
    return cloned;
  }
  return cloned;
}

function normalizeMessageContent(content: unknown, keepSentinelIfEmpty: boolean): unknown {
  if (typeof content === 'string') {
    const cleaned = stripSentinel(content);
    if (cleaned.length === 0 && keepSentinelIfEmpty) {
      return SENTINEL;
    }
    return cleaned;
  }
  if (Array.isArray(content)) {
    const stripped = stripTailSentinelFromNodes(content);
    const visible = stripSentinel(extractNodeText(stripped));
    if (visible.length === 0 && keepSentinelIfEmpty) {
      return [{ type: 'text', content: SENTINEL }];
    }
    return stripped;
  }
  return keepSentinelIfEmpty ? SENTINEL : content;
}

function isRevisionNodePair(first: any, second: any): boolean {
  return Boolean(
    first &&
      typeof first === 'object' &&
      first.type === 's' &&
      second &&
      typeof second === 'object' &&
      second.type === 'text' &&
      typeof second.content === 'string' &&
      second.content.indexOf('(edited)') >= 0,
  );
}

function transformMessageRow(row: Record<string, any>): boolean {
  const msg = row.message as Record<string, any>;
  const id = String(msg.id);

  if (!deletedMessages.has(id) && msg.channelId) {
    const text = stripSentinel(extractMessageText(msg));
    const existingCached = renderedRowCache.get(id);
    if (!existingCached && text) {
      setWithCap(
        renderedRowCache,
        id,
        {
          channelId: String(msg.channelId),
          content: text,
          authorId: msg.authorId ? String(msg.authorId) : undefined,
          bot: Boolean(msg.bot || msg.tagText === 'BOT' || msg.tagText === 'APP'),
        },
        MAX_CACHED_ROWS,
      );
    } else if (existingCached && !existingCached.authorId && msg.authorId) {
      existingCached.authorId = String(msg.authorId);
    }
  }

  if (deletedMessages.size === 0 && editHistory.size === 0) {
    return false;
  }

  const isDeleted = deletedMessages.has(id);
  const revisions = editHistory.get(id);

  if (!isDeleted && (!revisions || revisions.length === 0)) {
    return false;
  }

  const hasRevisions = Boolean(revisions && revisions.length > 0);
  msg.content = normalizeMessageContent(msg.content, isDeleted && !hasRevisions);

  if (revisions && revisions.length > 0) {
    const baseNodes: any[] =
      typeof msg.content === 'string'
        ? msg.content.length > 0
          ? [{ type: 'text', content: msg.content }]
          : []
        : Array.isArray(msg.content)
          ? msg.content.slice()
          : [];

    if (!isRevisionNodePair(baseNodes[0], baseNodes[1])) {
      const revisionNodes: any[] = [];
      for (let i = 0; i < revisions.length; i += 1) {
        revisionNodes.push(
          { type: 's', content: [{ type: 'text', content: revisions[i].content }] },
          { type: 'text', content: ' (edited)\n' },
        );
      }
      msg.content = [...revisionNodes, ...baseNodes];
    }
  }

  if (isDeleted) {
    const isLight = getThemeStore<{ theme?: string }>()?.theme === 'light';
    const deletedBg = isLight
      ? toAndroidColor(0x1f, 0xda, 0x37, 0x3c)
      : toAndroidColor(0x24, 0xf2, 0x3f, 0x43);
    const deletedGutter = isLight
      ? toAndroidColor(0xff, 0xda, 0x37, 0x3c)
      : toAndroidColor(0xff, 0xf2, 0x3f, 0x43);
    const deletedText = isLight
      ? toAndroidColor(0xff, 0xb9, 0x1c, 0x1c)
      : toAndroidColor(0xff, 0xf8, 0x71, 0x71);
    const deletedBadge = deletedGutter;

    row.backgroundHighlight = {
      backgroundColor: deletedBg,
      gutterColor: deletedGutter,
    };
    msg.textColor = deletedText;
    if (!msg.edited) {
      msg.edited = 'deleted';
    } else if (!String(msg.edited).includes('deleted')) {
      msg.edited = `${msg.edited} • deleted`;
    }
    msg.editedColor = deletedBadge;

    if (Array.isArray(msg.attachments) && msg.attachments.length > 0) {
      msg.attachmentsOpacity = 0.6;
    }
  }

  console.log(
    `[Nekocord/MessageLogger] Decorated inline row ${id} (deleted=${isDeleted}, revisions=${revisions?.length ?? 0})`,
  );
  return true;
}

/**
 * Returns telemetry counts for inline deleted messages and edit revisions.
 */
export function getMessageLoggerStats(): {
  deletedCount: number;
  editedMessageCount: number;
  totalRevisions: number;
  hookReady: boolean;
} {
  let totalRevisions = 0;
  editHistory.forEach((list) => {
    totalRevisions += list.length;
  });
  return {
    deletedCount: deletedMessages.size,
    editedMessageCount: editHistory.size,
    totalRevisions,
    hookReady: isChatRowHookReady(),
  };
}

/**
 * Clears retained deleted-message and edit-revision caches.
 */
export function clearInlineMessageHistory(): void {
  deletedMessages.clear();
  editHistory.clear();
}

export default definePlugin({
  settings,
  start() {
    console.log(
      `[Nekocord/MessageLogger] Started (logDeletes=${settings.store.logDeletes}, logEdits=${settings.store.logEdits}, ignoreSelf=${settings.store.ignoreSelf})`,
    );

    if (!unregisterRowTransformer) {
      unregisterRowTransformer = registerMessageRowTransformer(transformMessageRow);
    }

    if (!cancelActionsWait) {
      cancelActionsWait = onMessageActions((actions) => {
        if (unpatchEditAction || typeof actions.editMessage !== 'function') {
          return;
        }
        unpatchEditAction = before(actions, 'editMessage', (channelId: any, messageId: any) => {
          const chId = String(channelId ?? '');
          const id = String(messageId ?? '');
          if (!chId || !id) return;
          const prev = getMessageFromStore(chId, id);
          if (prev && typeof prev.content === 'string' && !shouldSkipMessage(prev)) {
            setWithCap(
              renderedRowCache,
              id,
              {
                channelId: chId,
                content: stripSentinel(prev.content),
                authorId: prev.author?.id ? String(prev.author.id) : undefined,
                bot: Boolean(prev.author?.bot),
              },
              MAX_CACHED_ROWS,
            );
          }
        });
      });
    }

    if (!stopIntercept) {
      stopIntercept = interceptFluxDispatcher((action, args, orig) => {
        if (action.type === 'MESSAGE_UPDATE') {
          if (settings.store.logEdits) {
            handleMessageUpdateDispatch(action);
          }
          return orig(...args);
        }

        if (action.type === 'MESSAGE_DELETE') {
          return settings.store.logDeletes ? handleMessageDelete(action, orig, args) : orig(...args);
        }

        if (action.type === 'MESSAGE_DELETE_BULK') {
          return settings.store.logDeletes
            ? handleMessageDeleteBulk(action, orig, args)
            : orig(...args);
        }

        return orig(...args);
      });
    }
  },

  stop() {
    cancelActionsWait?.();
    cancelActionsWait = null;
    unpatchEditAction?.();
    unpatchEditAction = null;
    stopIntercept?.();
    stopIntercept = null;
    if (unregisterRowTransformer) {
      unregisterRowTransformer();
      unregisterRowTransformer = null;
    }
  },
});
