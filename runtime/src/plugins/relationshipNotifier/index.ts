import {
  getChannelStore,
  getRelationshipStore,
  getStore,
  getUserStore,
  interceptFluxDispatcher,
} from '../../metro/common.js';
import { pushNotification } from '../../notifications/index.js';
import { definePlugin } from '../types.js';

const MAX_RECENT_EVENTS = 25;

let stopIntercept: (() => void) | null = null;
let totalEvents = 0;
const recentEvents: Array<{ summary: string; at: string }> = [];

function formatTimeNow(): string {
  const d = new Date();
  const hh = d.getHours() < 10 ? `0${d.getHours()}` : String(d.getHours());
  const mm = d.getMinutes() < 10 ? `0${d.getMinutes()}` : String(d.getMinutes());
  return `${hh}:${mm}`;
}

function recordEvent(summary: string): void {
  totalEvents += 1;
  recentEvents.unshift({ summary, at: formatTimeNow() });
  if (recentEvents.length > MAX_RECENT_EVENTS) {
    recentEvents.length = MAX_RECENT_EVENTS;
  }
  console.log(`[Nekocord/RelationshipNotifier] ${summary}`);
  pushNotification({
    title: 'Relationship Update',
    body: summary,
    source: 'RelationshipNotifier',
    kind: 'warning',
    showToast: true,
  });
}

function handleDispatchBefore(action: any): void {
  if (!action || typeof action !== 'object') {
    return;
  }

  if (action.type === 'RELATIONSHIP_REMOVE') {
    const userId = String(action.relationship?.id ?? action.user?.id ?? action.id ?? '');
    const relType =
      action.relationship?.type ??
      (userId ? getRelationshipStore<any>()?.getRelationshipType?.(userId) : undefined);
    if (relType !== undefined && relType !== 1 && relType !== 3) {
      return;
    }
    const user = userId ? getUserStore()?.getUser?.(userId) : null;
    const label = user?.username ? `@${user.username}` : userId || 'Unknown user';
    recordEvent(relType === 3 ? `Friend request removed: ${label}` : `Friend removed: ${label}`);
    return;
  }

  if (action.type === 'GUILD_DELETE') {
    if (action.guild?.unavailable === true) {
      return;
    }
    const guildId = String(action.guild?.id ?? action.guildId ?? '');
    if (!guildId) {
      return;
    }
    const guild = getStore<{ getGuild?: (id: string) => any }>('GuildStore')?.getGuild?.(guildId);
    const name = guild?.name ?? action.guild?.name ?? guildId;
    recordEvent(`Removed from server: ${name}`);
    return;
  }

  if (action.type === 'CHANNEL_DELETE') {
    const channelId = String(action.channel?.id ?? action.channelId ?? '');
    const cached = channelId ? getChannelStore()?.getChannel?.(channelId) : null;
    const channelType = action.channel?.type ?? cached?.type;
    if (channelType !== 3) {
      return;
    }
    const name = cached?.name ?? action.channel?.name ?? channelId;
    recordEvent(`Removed from group DM: ${name}`);
  }
}

export default definePlugin({
  start() {
    if (stopIntercept) return;
    stopIntercept = interceptFluxDispatcher((action, args, orig) => {
      try {
        handleDispatchBefore(action);
      } catch (err) {
        console.error('[Nekocord/RelationshipNotifier] Inspect error:', err);
      }
      return orig(...args);
    });
  },

  stop() {
    stopIntercept?.();
    stopIntercept = null;
  },
});
