import { onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { definePlugin } from '../types.js';

const guildCounts = new Map<string, { memberCount: number; onlineCount?: number }>();
let cancelWait: (() => void) | null = null;
let dispatcherRef: FluxDispatcher | null = null;

function onGuildCreate(action: Record<string, any>) {
  const g = action?.guild;
  if (g?.id && typeof g.member_count === 'number') {
    const prev = guildCounts.get(String(g.id));
    guildCounts.set(String(g.id), {
      memberCount: g.member_count,
      onlineCount: prev?.onlineCount,
    });
  }
}

function onMemberListUpdate(action: Record<string, any>) {
  if (action?.guildId && typeof action.onlineCount === 'number') {
    const prev = guildCounts.get(String(action.guildId));
    guildCounts.set(String(action.guildId), {
      memberCount: prev?.memberCount ?? action.memberCount ?? 0,
      onlineCount: action.onlineCount,
    });
  }
}

export function getTrackedMemberCount(guildId: string) {
  return guildCounts.get(guildId) ?? null;
}

export default definePlugin({
  start() {
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (!dispatcherRef) {
        dispatcherRef = dispatcher;
        dispatcher.subscribe('GUILD_CREATE', onGuildCreate);
        dispatcher.subscribe('GUILD_MEMBER_LIST_UPDATE', onMemberListUpdate);
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('GUILD_CREATE', onGuildCreate);
      dispatcherRef.unsubscribe('GUILD_MEMBER_LIST_UPDATE', onMemberListUpdate);
      dispatcherRef = null;
    }
    guildCounts.clear();
  },
});
