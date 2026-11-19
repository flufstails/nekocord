import { waitForStore } from '../../metro/index.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const unpatches: Unpatch[] = [];
let cancelRelWait: (() => void) | null = null;
let cancelReqWait: (() => void) | null = null;
let zeroedCount = 0;
let hookedStores = 0;

function patchZeroCounter(store: any, method: string): boolean {
  if (!store || typeof store[method] !== 'function') {
    return false;
  }
  try {
    const u = instead(store, method, (args: any[], orig: (...a: any[]) => any) => {
      const actual = orig(...args);
      if (typeof actual === 'number' ? actual > 0 : Boolean(actual)) {
        zeroedCount += 1;
      }
      return 0;
    });
    unpatches.push(u);
    hookedStores += 1;
    return true;
  } catch {
    return false;
  }
}

export default definePlugin({
  start() {
    cancelRelWait = waitForStore('RelationshipStore', (store) => {
      patchZeroCounter(store, 'getPendingCount');
    });

    cancelReqWait = waitForStore('MessageRequestStore', (store) => {
      patchZeroCounter(store, 'getMessageRequestsCount');
    });
  },

  stop() {
    if (cancelRelWait) {
      cancelRelWait();
      cancelRelWait = null;
    }
    if (cancelReqWait) {
      cancelReqWait();
      cancelReqWait = null;
    }
    while (unpatches.length > 0) {
      const fn = unpatches.pop();
      fn?.();
    }
    hookedStores = 0;
  },
});
