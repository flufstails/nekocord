import {
  getChannelStore,
  getMessageActions,
  getUserStore,
  onFluxDispatcher,
  type FluxDispatcher,
} from '../../metro/common.js';
import { pushNotification } from '../../notifications/index.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  replyMessage: {
    type: OptionType.STRING,
    label: 'Auto-Reply Message',
    description: 'Message sent automatically once per channel cooldown when away.',
    placeholder: 'I am currently away on mobile, I will reply soon.',
    default: 'I am currently away right now, I will reply when I am back.',
  },
  cooldownMinutes: {
    type: OptionType.NUMBER,
    label: 'Channel Cooldown (Minutes)',
    description: 'Minimum minutes between automated replies in the same channel.',
    min: 1,
    max: 1440,
    default: 30,
  },
  dmOnly: {
    type: OptionType.BOOLEAN,
    label: 'Direct Messages Only',
    description: 'Only auto-reply to direct messages and group DMs (never guild channels).',
    default: true,
  },
});

let dispatcherRef: FluxDispatcher | null = null;
let cancelWait: (() => void) | null = null;
const lastRepliedAt = new Map<string, number>();

const onMessageCreate = (action: Record<string, any>) => {
  const msg = action.message;
  if (!msg || typeof msg !== 'object') return;
  const selfId = getUserStore()?.getCurrentUser?.()?.id;
  const authorId = msg.author?.id;
  if (!authorId || msg.author?.bot || (selfId && String(authorId) === String(selfId))) {
    return;
  }

  const channelId = msg.channel_id ? String(msg.channel_id) : '';
  if (!channelId) return;
  const ch = getChannelStore()?.getChannel?.(channelId);
  const isDm = !msg.guild_id && (!ch || ch.type === 1 || ch.type === 3);
  if (settings.store.dmOnly && !isDm) {
    return;
  }

  const now = Date.now();
  const cooldownMs = Math.max(1, Number(settings.store.cooldownMinutes) || 30) * 60000;
  const prev = lastRepliedAt.get(channelId) ?? 0;
  if (now - prev < cooldownMs) {
    return;
  }

  const text = String(settings.store.replyMessage || '').trim();
  if (!text) return;
  const actions = getMessageActions();
  if (typeof actions?.sendMessage === 'function') {
    lastRepliedAt.set(channelId, now);
    actions.sendMessage(channelId, { content: text });
    pushNotification({
      title: 'AutoReplyAway Sent',
      body: `Replied to ${msg.author?.username || 'user'} in channel ${channelId}.`,
      source: 'AutoReplyAway',
      kind: 'info',
      showToast: false,
      channelId,
    });
  }
};

export default definePlugin({
  settings,
  start() {
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (!dispatcherRef) {
        dispatcherRef = dispatcher;
        dispatcher.subscribe('MESSAGE_CREATE', onMessageCreate);
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('MESSAGE_CREATE', onMessageCreate);
      dispatcherRef = null;
    }
    lastRepliedAt.clear();
  },
});
