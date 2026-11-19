import { getStore, onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { findByProps, watchNamedExports } from '../../metro/index.js';
import { definePlugin } from '../types.js';

const VOICE_TARGET_NAMES = new Set(['toggleSelfMute']);

let cancelDispatcherWait: (() => void) | null = null;
let cancelWatch: (() => void) | null = null;
let activeDispatcher: FluxDispatcher | null = null;
let toggleSelfMuteFn: (() => unknown) | null = null;
let pendingMuteTimer: ReturnType<typeof setTimeout> | null = null;
let lastChannelId: string | null = null;
let mutedOnJoinCount = 0;

function readCurrentVoiceChannelId(): string | null {
  try {
    const ch = getStore<{ getVoiceChannelId?: () => string | null }>(
      'SelectedChannelStore',
    )?.getVoiceChannelId?.();
    return ch ? String(ch) : null;
  } catch {
    return null;
  }
}

function handleVoiceChannelSelect(action: any): void {
  const nextChannelId = action?.channelId ? String(action.channelId) : null;
  const prevChannelId = lastChannelId;
  lastChannelId = nextChannelId;

  if (!nextChannelId || nextChannelId === prevChannelId || !toggleSelfMuteFn) {
    return;
  }

  if (pendingMuteTimer) {
    clearTimeout(pendingMuteTimer);
  }
  pendingMuteTimer = setTimeout(() => {
    pendingMuteTimer = null;
    if (!activeDispatcher || !toggleSelfMuteFn) {
      return;
    }
    try {
      const mediaEngine = getStore<{ isSelfMute?: () => boolean }>('MediaEngineStore');
      const alreadyMuted = Boolean(mediaEngine?.isSelfMute?.());
      if (!alreadyMuted) {
        toggleSelfMuteFn();
        mutedOnJoinCount += 1;
      }
    } catch (err) {
      console.error('[Nekocord/VoiceMuteOnJoin] Failed to mute on join:', err);
    }
  }, 0);
}

export default definePlugin({
  start() {
    lastChannelId = readCurrentVoiceChannelId();

    const existing = findByProps('toggleSelfMute');
    if (typeof existing?.toggleSelfMute === 'function') {
      toggleSelfMuteFn = existing.toggleSelfMute.bind(existing);
    } else {
      cancelWatch = watchNamedExports(VOICE_TARGET_NAMES, (hit) => {
        if (!toggleSelfMuteFn && typeof hit.target[hit.key] === 'function') {
          toggleSelfMuteFn = hit.target[hit.key].bind(hit.target);
        }
      });
    }

    cancelDispatcherWait = onFluxDispatcher((dispatcher) => {
      if (!activeDispatcher) {
        activeDispatcher = dispatcher;
        dispatcher.subscribe('VOICE_CHANNEL_SELECT', handleVoiceChannelSelect);
      }
    });
  },

  stop() {
    if (pendingMuteTimer) {
      clearTimeout(pendingMuteTimer);
      pendingMuteTimer = null;
    }
    if (cancelDispatcherWait) {
      cancelDispatcherWait();
      cancelDispatcherWait = null;
    }
    if (cancelWatch) {
      cancelWatch();
      cancelWatch = null;
    }
    if (activeDispatcher) {
      activeDispatcher.unsubscribe('VOICE_CHANNEL_SELECT', handleVoiceChannelSelect);
      activeDispatcher = null;
    }
    toggleSelfMuteFn = null;
    lastChannelId = null;
  },
});
