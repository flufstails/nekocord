import { onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { pad2 } from '../_shared/chatDisplay.js';
import { definePlugin } from '../types.js';

let cancelWait: (() => void) | null = null;
let dispatcherRef: FluxDispatcher | null = null;
let activeChannelId: string | null = null;
let joinedAt = 0;

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}`;
}

function onVoiceSelect(action: Record<string, any>) {
  const nextId = action?.channelId ? String(action.channelId) : null;
  if (nextId === activeChannelId) return;
  if (activeChannelId && joinedAt > 0) {
    console.log(`[Nekocord/CallTimer] Left voice channel ${activeChannelId} after ${formatDuration(Date.now() - joinedAt)}`);
  }
  activeChannelId = nextId;
  joinedAt = nextId ? Date.now() : 0;
}

export default definePlugin({
  start() {
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (!dispatcherRef) {
        dispatcherRef = dispatcher;
        dispatcher.subscribe('VOICE_CHANNEL_SELECT', onVoiceSelect);
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('VOICE_CHANNEL_SELECT', onVoiceSelect);
      dispatcherRef = null;
    }
    activeChannelId = null;
    joinedAt = 0;
  },
});
