import { waitForStore } from '../../metro/index.js';
import { after, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';
import { cloneWithPrototype } from '../_shared/fluxAndPrivacy.js';

let cancelWait: (() => void) | null = null;
let unpatch: Unpatch | null = null;

export default definePlugin({
  start() {
    cancelWait = waitForStore('ChannelStore', (store) => {
      if (unpatch || typeof store.getChannel !== 'function') return;
      try {
        unpatch = after(store, 'getChannel', (_args, ch: any) => {
          if (!ch || typeof ch !== 'object' || ch.type !== 15 || ch.defaultSortOrder === 0) {
            return ch;
          }
          return cloneWithPrototype(ch, { defaultSortOrder: 0 });
        });
      } catch {
        // Ignore locked ChannelStore methods.
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
