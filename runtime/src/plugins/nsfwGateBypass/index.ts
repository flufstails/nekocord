import { getUserStore } from '../../metro/common.js';
import { findByProps, findByStoreName, waitFor, waitForStore } from '../../metro/index.js';
import { after, instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const cleanups: Array<() => void> = [];
let userStoreHooked = false;
let ageGatePatched = false;
let nsfwGatedPatched = false;
const originalNsfwDescriptors = new Map<
  object,
  { hadOwn: boolean; descriptor?: PropertyDescriptor }
>();

function overrideUserNsfwAllowed(user: any): any {
  if (!user || typeof user !== 'object') {
    return user;
  }
  if (user.nsfwAllowed === true) {
    return user;
  }
  try {
    if (!originalNsfwDescriptors.has(user)) {
      const hadOwn = Object.prototype.hasOwnProperty.call(user, 'nsfwAllowed');
      const descriptor = hadOwn ? Object.getOwnPropertyDescriptor(user, 'nsfwAllowed') : undefined;
      originalNsfwDescriptors.set(user, { hadOwn, descriptor });
    }
    Object.defineProperty(user, 'nsfwAllowed', {
      configurable: true,
      enumerable: true,
      get: () => true,
    });
    return user;
  } catch {
    return user;
  }
}

function patchUserStore(store: any): void {
  if (userStoreHooked || typeof store?.getCurrentUser !== 'function') {
    return;
  }
  userStoreHooked = true;
  const u: Unpatch = after(store, 'getCurrentUser', (_args, res) => {
    return overrideUserNsfwAllowed(res);
  });
  cleanups.push(u);
  try {
    overrideUserNsfwAllowed(store.getCurrentUser());
  } catch {
    // Ignore if UserStore is not ready yet.
  }
}

function patchAgeGateMod(mod: any): void {
  if (ageGatePatched || typeof mod?.shouldAgeVerifyForAgeGate !== 'function') {
    return;
  }
  ageGatePatched = true;
  try {
    cleanups.push(instead(mod, 'shouldAgeVerifyForAgeGate', () => false));
  } catch {
    // Ignore locked exports.
  }
}

function patchNsfwGatedMod(mod: any): void {
  if (nsfwGatedPatched || typeof mod?.useIsNsfwGated !== 'function') {
    return;
  }
  nsfwGatedPatched = true;
  try {
    cleanups.push(instead(mod, 'useIsNsfwGated', () => false));
  } catch {
    // Ignore locked exports.
  }
}

/**
 * Reports whether NSFW bypass hooks are active.
 */
export function isNsfwBypassReady(): boolean {
  return userStoreHooked || ageGatePatched || nsfwGatedPatched;
}

export default definePlugin({
  start() {
    const existingUserStore = getUserStore() ?? findByStoreName('UserStore');
    if (existingUserStore) {
      patchUserStore(existingUserStore);
    } else {
      cleanups.push(waitForStore('UserStore', patchUserStore));
    }

    const existingAgeGate = findByProps('shouldAgeVerifyForAgeGate');
    if (existingAgeGate) {
      patchAgeGateMod(existingAgeGate);
    } else {
      cleanups.push(
        waitFor(
          (m) =>
            typeof m === 'object' &&
            m !== null &&
            typeof m.shouldAgeVerifyForAgeGate === 'function',
          patchAgeGateMod,
        ),
      );
    }

    const existingNsfwGated = findByProps('useIsNsfwGated');
    if (existingNsfwGated) {
      patchNsfwGatedMod(existingNsfwGated);
    } else {
      cleanups.push(
        waitFor(
          (m) =>
            typeof m === 'object' &&
            m !== null &&
            typeof m.useIsNsfwGated === 'function',
          patchNsfwGatedMod,
        ),
      );
    }
  },

  stop() {
    while (cleanups.length > 0) {
      const fn = cleanups.pop();
      fn?.();
    }
    originalNsfwDescriptors.forEach((entry, userObj) => {
      try {
        if (entry.hadOwn && entry.descriptor) {
          Object.defineProperty(userObj, 'nsfwAllowed', entry.descriptor);
        } else {
          delete (userObj as Record<string, unknown>).nsfwAllowed;
        }
      } catch {
        // Ignore frozen user objects.
      }
    });
    originalNsfwDescriptors.clear();
    userStoreHooked = false;
    ageGatePatched = false;
    nsfwGatedPatched = false;
  },
});
