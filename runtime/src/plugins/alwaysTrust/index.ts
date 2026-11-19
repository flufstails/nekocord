import { findByProps, waitFor, waitForStore } from '../../metro/index.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const unpatches: Unpatch[] = [];
const patchedTargets = new WeakSet<object>();
let cancelStoreWait: (() => void) | null = null;
let cancelDomainWait: (() => void) | null = null;
let cancelLinkWait: (() => void) | null = null;
let trustedCount = 0;
let hookedModules = 0;

function patchTrustTarget(target: any): boolean {
  if (!target || (typeof target !== 'object' && typeof target !== 'function')) {
    return false;
  }
  if (patchedTargets.has(target)) {
    return false;
  }
  let patchedAny = false;
  for (const method of ['isTrustedDomain', 'isLinkTrusted'] as const) {
    if (typeof target[method] === 'function') {
      try {
        const u = instead(target, method, () => {
          trustedCount += 1;
          return true;
        });
        unpatches.push(u);
        patchedAny = true;
      } catch {
        // Skip locked methods.
      }
    }
  }
  if (patchedAny) {
    patchedTargets.add(target);
    hookedModules += 1;
  }
  return patchedAny;
}

export default definePlugin({
  start() {
    cancelStoreWait = waitForStore('MaskedLinkStore', (store) => {
      patchTrustTarget(store);
    });

    const existingDomain = findByProps('isTrustedDomain');
    if (!patchTrustTarget(existingDomain)) {
      cancelDomainWait = waitFor(
        (m) => typeof m === 'object' && m !== null && typeof m.isTrustedDomain === 'function',
        (mod) => {
          patchTrustTarget(mod);
        },
      );
    }

    const existingLink = findByProps('isLinkTrusted');
    if (!patchTrustTarget(existingLink)) {
      cancelLinkWait = waitFor(
        (m) => typeof m === 'object' && m !== null && typeof m.isLinkTrusted === 'function',
        (mod) => {
          patchTrustTarget(mod);
        },
      );
    }
  },

  stop() {
    if (cancelStoreWait) {
      cancelStoreWait();
      cancelStoreWait = null;
    }
    if (cancelDomainWait) {
      cancelDomainWait();
      cancelDomainWait = null;
    }
    if (cancelLinkWait) {
      cancelLinkWait();
      cancelLinkWait = null;
    }
    while (unpatches.length > 0) {
      const fn = unpatches.pop();
      fn?.();
    }
    hookedModules = 0;
  },
});
