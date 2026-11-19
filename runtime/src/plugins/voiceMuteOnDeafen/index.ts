import { getStore, onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { findByProps } from '../../metro/index.js';
import { definePlugin } from '../types.js';

let cancelWait: (() => void) | null = null;
let dispatcherRef: FluxDispatcher | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

const onToggleSelfDeaf = () => {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
  }
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    if (!dispatcherRef) return;
    const media = getStore<any>('MediaEngineStore');
    if (media?.isSelfDeaf?.() && !media?.isSelfMute?.()) {
      const actions = findByProps('toggleSelfMute', 'toggleSelfDeaf');
      actions?.toggleSelfMute?.();
    }
  }, 0);
};

export default definePlugin({
  start() {
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (!dispatcherRef) {
        dispatcherRef = dispatcher;
        dispatcher.subscribe('AUDIO_TOGGLE_SELF_DEAF', onToggleSelfDeaf);
      }
    });
  },
  stop() {
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
    cancelWait?.();
    cancelWait = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('AUDIO_TOGGLE_SELF_DEAF', onToggleSelfDeaf);
      dispatcherRef = null;
    }
  },
});
