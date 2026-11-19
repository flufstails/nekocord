import { waitForStore } from '../../metro/index.js';
import { after, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let cancelWait: (() => void) | null = null;
let unpatch: Unpatch | null = null;

export default definePlugin({
  start() {
    cancelWait = waitForStore('MediaEngineStore', (store) => {
      if (unpatch || typeof store.getLocalVolume !== 'function') return;
      try {
        unpatch = after(store, 'getLocalVolume', (_args, vol) => {
          if (typeof vol === 'number' && Number.isFinite(vol) && vol > 200) {
            return Math.min(vol, 400);
          }
          return vol;
        });
      } catch {
        // Ignore locked MediaEngineStore methods.
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    unpatch?.();
    unpatch = null;
  },
});
