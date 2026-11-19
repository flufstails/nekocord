import { waitForStore } from '../../metro/index.js';
import { after, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let cancelWait: (() => void) | null = null;
let unpatchCan: Unpatch | null = null;

function isViewChannelPerm(perm: unknown): boolean {
  if (typeof perm === 'bigint') {
    const bit = BigInt(1024);
    return (perm & bit) === bit;
  }
  if (typeof perm === 'number') {
    return (perm & 0x400) === 0x400;
  }
  return false;
}

export default definePlugin({
  start() {
    cancelWait = waitForStore('PermissionStore', (store) => {
      if (unpatchCan || typeof store.can !== 'function') return;
      try {
        unpatchCan = after(store, 'can', (args: any[], res: any) => {
          if (res === true) return res;
          const [perm, channel] = args;
          if (!isViewChannelPerm(perm)) return res;
          if (channel && typeof channel === 'object' && channel.guild_id) {
            return true;
          }
          return res;
        });
      } catch {
        // Ignore locked PermissionStore methods.
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    unpatchCan?.();
    unpatchCan = null;
  },
});
