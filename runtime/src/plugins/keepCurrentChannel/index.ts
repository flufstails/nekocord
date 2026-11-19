import { onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { definePlugin } from '../types.js';

const lastChannelByGuild = new Map<string, string>();
let cancelWait: (() => void) | null = null;
let dispatcherRef: FluxDispatcher | null = null;

function onChannelSelect(action: Record<string, any>) {
  if (action?.channelId) {
    lastChannelByGuild.set(String(action.guildId ?? '@me'), String(action.channelId));
  }
}

export function getLastChannelForGuild(guildId?: string): string | null {
  return lastChannelByGuild.get(guildId ?? '@me') ?? null;
}

export default definePlugin({
  start() {
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (!dispatcherRef) {
        dispatcherRef = dispatcher;
        dispatcher.subscribe('CHANNEL_SELECT', onChannelSelect);
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('CHANNEL_SELECT', onChannelSelect);
      dispatcherRef = null;
    }
  },
});
