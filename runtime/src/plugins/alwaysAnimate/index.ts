import { registerMessageRowTransformer } from '../../chat/rows.js';
import { waitForStore, watchNamedExports } from '../../metro/index.js';
import { after, instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const ANIMATE_TARGET_NAMES = new Set(['useShouldAnimate']);
const STORE_BOOL_GETTERS = ['autoPlayGifs', 'animateEmoji', 'animateStickers'] as const;

let unregisterRowTransformer: (() => void) | null = null;
let cancelWatch: (() => void) | null = null;
let cancelStoreWait: (() => void) | null = null;
const cleanups: Array<() => void> = [];
let forcedCount = 0;
let hooksActive = 0;

function overrideStoreGetters(store: Record<string, any>): void {
  for (const prop of STORE_BOOL_GETTERS) {
    if (typeof store[prop] === 'function') {
      try {
        const u: Unpatch = instead(store, prop, () => true);
        cleanups.push(u);
        hooksActive += 1;
      } catch {
        // Skip locked store methods.
      }
      continue;
    }

    try {
      const desc = Object.getOwnPropertyDescriptor(store, prop);
      if (desc && desc.configurable) {
        Object.defineProperty(store, prop, {
          configurable: true,
          enumerable: desc.enumerable ?? false,
          get: () => true,
        });
        hooksActive += 1;
        cleanups.push(() => {
          try {
            Object.defineProperty(store, prop, desc);
          } catch {
            // Ignore restore failure.
          }
        });
      }
    } catch {
      // Ignore non-configurable store getters.
    }
  }
}

export default definePlugin({
  start() {
    unregisterRowTransformer = registerMessageRowTransformer((row) => {
      const msg = row.message;
      if (msg && typeof msg === 'object' && msg.gifAutoPlay !== true) {
        msg.gifAutoPlay = true;
        forcedCount += 1;
        return true;
      }
      return false;
    });

    cancelWatch = watchNamedExports(ANIMATE_TARGET_NAMES, (hit) => {
      try {
        cleanups.push(
          after(hit.target, hit.key, () => {
            forcedCount += 1;
            return true;
          }),
        );
        hooksActive += 1;
      } catch {
        // Ignore locked hooks.
      }
    });

    cancelStoreWait = waitForStore('AccessibilityStore', (store) => {
      overrideStoreGetters(store);
    });
  },

  stop() {
    if (unregisterRowTransformer) {
      unregisterRowTransformer();
      unregisterRowTransformer = null;
    }
    if (cancelWatch) {
      cancelWatch();
      cancelWatch = null;
    }
    if (cancelStoreWait) {
      cancelStoreWait();
      cancelStoreWait = null;
    }
    while (cleanups.length > 0) {
      const fn = cleanups.pop();
      fn?.();
    }
    hooksActive = 0;
  },
});
