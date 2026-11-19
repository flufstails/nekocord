import { waitForStore } from '../../metro/index.js';
import { after, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const unpatches: Unpatch[] = [];
let cancelStoreWait: (() => void) | null = null;
let strippedCount = 0;
let storeHooked = false;

function stripProfileThemeColors(profile: any): any {
  if (
    !profile ||
    typeof profile !== 'object' ||
    !Array.isArray(profile.themeColors) ||
    profile.themeColors.length === 0
  ) {
    return profile;
  }

  strippedCount += 1;
  const proto = Object.getPrototypeOf(profile);
  const clone =
    proto && proto !== Object.prototype ? Object.assign(Object.create(proto), profile) : { ...profile };
  clone.themeColors = undefined;
  return clone;
}

export default definePlugin({
  start() {
    cancelStoreWait = waitForStore('UserProfileStore', (store) => {
      if (storeHooked) {
        return;
      }
      let patched = false;
      for (const method of ['getUserProfile', 'getGuildMemberProfile'] as const) {
        if (typeof store[method] === 'function') {
          try {
            const u = after(store, method, (_args: any[], res: any) => stripProfileThemeColors(res));
            unpatches.push(u);
            patched = true;
          } catch {
            // Skip locked methods.
          }
        }
      }
      storeHooked = patched;
    });
  },

  stop() {
    if (cancelStoreWait) {
      cancelStoreWait();
      cancelStoreWait = null;
    }
    while (unpatches.length > 0) {
      const fn = unpatches.pop();
      fn?.();
    }
    storeHooked = false;
  },
});
