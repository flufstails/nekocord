import { isChatRowHookReady, registerMessageRowTransformer, toAndroidColor } from '../../chat/rows.js';
import {
  getMessageStore,
  getThemeStore,
  getUserStore,
  onFluxDispatcher,
  type FluxDispatcher,
} from '../../metro/common.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  logDeletes: {
    type: OptionType.BOOLEAN,
    label: 'Log Deleted Messages',
    description: 'Retain deleted messages inline with a deleted status badge.',
    default: true,
  },
  logEdits: {
    type: OptionType.BOOLEAN,
    label: 'Log Edited Messages',
    description: 'Preserve previous message content revisions above edited messages.',
    default: true,
  },
  ignoreBots: {
    type: OptionType.BOOLEAN,
    label: 'Ignore Bots',
    description: 'Do not track deletions or edits from bot and webhook accounts.',
    default: false,
  },
  ignoreSelf: {
    type: OptionType.BOOLEAN,
    label: 'Ignore Own Messages',
    description: 'Do not retain edits or deletions for messages sent by your own account.',
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

const MAX_TRACKED_MESSAGES = 500;
const MAX_REVISIONS_PER_MESSAGE = 10;
const DUPLICATE_DELETE_WINDOW_MS = 3000;
const SENTINEL = '\u200b';
const SENTINEL_TAIL_RE = /(?:\u200b ?)+$/g;
const EPHEMERAL_FLAG = 64;

const deletedMessages = new Map<string, DeletedRecord>();
const editHistory = new Map<string, EditRevision[]>();

let cancelDispatcherWait: (() => void) | null = null;
let unpatchDispatch: Unpatch | null = null;
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
      return store.getMessage(channelId, id);
    }
    if (typeof store.getMessages === 'function') {
      return store.getMessages(channelId)?.get?.(id);
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
  if (ts && typeof ts === 'object' && typeof (ts as { toISOString?: unknown }).toISOString === 'function') {
    try {
      return (ts as { toISOString: () => string }).toISOString();
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function buildSyntheticMessageUpdate(existing: any, channelId: string, id: string): Record<string, any> {
  const baseContent = typeof existing.content === 'string' ? existing.content : '';
  const nextContent = baseContent.endsWith(SENTINEL) ? `${baseContent} ` : `${baseContent}${SENTINEL}`;

  const message: Record<string, any> = {
    id,
    channel_id: channelId,
    content: nextContent,
  };

  const editedIso = formatIsoTimestamp(existing.editedTimestamp);
  if (editedIso !== undefined) {
    message.edited_timestamp = editedIso;
  }

  return {
    type: 'MESSAGE_UPDATE',
    message,
    __purrcordSynthetic: true,
  };
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

function handleMessageUpdateDispatch(action: Record<string, any>): void {
  if (action.__purrcordSynthetic) {
    return;
  }
  const rawMsg = action.message;
  const id = rawMsg?.id ? String(rawMsg.id) : '';
  const channelId = rawMsg?.channel_id ? String(rawMsg.channel_id) : '';
  if (!id || !channelId || typeof rawMsg.content !== 'string') {
    return;
  }

  const prev = getMessageFromStore(channelId, id);
  if (!prev || shouldSkipMessage(prev) || typeof prev.content !== 'string') {
    return;
  }

  const prevClean = stripSentinel(prev.content);
  const nextClean = stripSentinel(rawMsg.content);
  if (prevClean.length > 0 && prevClean !== nextClean) {
    recordEditRevision(id, prevClean);
  }
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
  const channelId = action.channelId ? String(action.channelId) : '';
  if (!id || !channelId) {
    return orig(...args);
  }

  const existing = getMessageFromStore(channelId, id);
  console.log(
    `[Nekocord/MessageLogger] MESSAGE_DELETE id=${id} found=${Boolean(existing)} hookReady=${isChatRowHookReady()}`,
  );
  if (shouldSkipMessage(existing)) {
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

  setWithCap(deletedMessages, id, { channelId, deletedAt: Date.now() }, MAX_TRACKED_MESSAGES);
  return orig(buildSyntheticMessageUpdate(existing, channelId, id));
}

function handleMessageDeleteBulk(
  action: Record<string, any>,
  orig: (...args: any[]) => any,
  args: any[],
): any {
  if (action.__purrcordBypass) {
    return orig(...args);
  }
  const channelId = action.channelId ? String(action.channelId) : '';
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
    const existing = getMessageFromStore(channelId, id);
    if (shouldSkipMessage(existing)) {
      remainingIds.push(rawId);
      continue;
    }
    setWithCap(deletedMessages, id, { channelId, deletedAt: Date.now() }, MAX_TRACKED_MESSAGES);
    orig(buildSyntheticMessageUpdate(existing, channelId, id));
  }

  if (remainingIds.length === 0) {
    return undefined;
  }
  if (remainingIds.length === ids.length) {
    return orig(...args);
  }
  return orig({ ...action, ids: remainingIds });
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

function isRevisionSubtextNode(node: any): boolean {
  return (
    node &&
    typeof node === 'object' &&
    node.type === 'subtext' &&
    Array.isArray(node.content) &&
    node.content.length === 2 &&
    node.content[0]?.type === 's' &&
    node.content[1]?.type === 'text' &&
    node.content[1]?.content === ' (edited)'
  );
}

function transformMessageRow(row: Record<string, any>): boolean {
  if (deletedMessages.size === 0 && editHistory.size === 0) {
    return false;
  }

  const msg = row.message as Record<string, any>;
  const id = String(msg.id);
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

    if (!isRevisionSubtextNode(baseNodes[0])) {
      const revisionNodes = revisions.map((rev) => ({
        type: 'subtext',
        content: [
          { type: 's', content: [{ type: 'text', content: rev.content }] },
          { type: 'text', content: ' (edited)' },
        ],
      }));
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
    if (!unregisterRowTransformer) {
      unregisterRowTransformer = registerMessageRowTransformer(transformMessageRow);
    }

    cancelDispatcherWait = onFluxDispatcher((dispatcher: FluxDispatcher) => {
      if (unpatchDispatch) {
        return;
      }
      unpatchDispatch = instead(dispatcher, 'dispatch', (args, orig) => {
        const action = args[0] as Record<string, any> | undefined;
        if (!action || typeof action.type !== 'string') {
          return orig(...args);
        }

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
    });
  },

  stop() {
    if (cancelDispatcherWait) {
      cancelDispatcherWait();
      cancelDispatcherWait = null;
    }
    if (unpatchDispatch) {
      unpatchDispatch();
      unpatchDispatch = null;
    }
    if (unregisterRowTransformer) {
      unregisterRowTransformer();
      unregisterRowTransformer = null;
    }
  },
});
