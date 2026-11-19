import { waitForStore } from '../../metro/index.js';
import { after, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let cancelWait: (() => void) | null = null;
let unpatch: Unpatch | null = null;

export default definePlugin({
  start() {
    cancelWait = waitForStore('PermissionStore', (store) => {
      if (unpatch || typeof store.canManageUser !== 'function') return;
      try {
        unpatch = after(store, 'canManageUser', () => true);
      } catch {
        // Skip locked PermissionStore methods.
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
