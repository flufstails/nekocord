import { waitForStore } from '../../metro/index.js';
import { after, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let cancelWait: (() => void) | null = null;
let unpatch: Unpatch | null = null;

export default definePlugin({
  start() {
    cancelWait = waitForStore('RelationshipStore', (store) => {
      if (unpatch || typeof store.getPendingRelationships !== 'function') return;
      try {
        unpatch = after(store, 'getPendingRelationships', (_args, res) => {
          if (!Array.isArray(res)) return res;
          return res.slice().reverse();
        });
      } catch {
        // Skip locked store methods.
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
