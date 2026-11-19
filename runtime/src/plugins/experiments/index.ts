import { getStore, onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { findByProps, findByStoreName, waitFor, waitForStore } from '../../metro/index.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let cancelStoreWait: (() => void) | null = null;
let cancelPredicateWait: (() => void) | null = null;
let cancelDispatcherWait: (() => void) | null = null;
let subscribedDispatcher: FluxDispatcher | null = null;
let unpatchStoreFn: Unpatch | null = null;
let unpatchPredicateFn: Unpatch | null = null;
let patchedStoreTarget: any = null;
let patchedProtoTarget: any = null;
let hadOwnDescriptor = false;
let previousOwnDescriptor: PropertyDescriptor | undefined;
let previousProtoDescriptor: PropertyDescriptor | undefined;
let wroteWritableField = false;
let previousWritableValue: unknown;
let attemptedStores = new WeakSet<object>();

function patchDevExperimentStore(store: any): void {
  if (!store || patchedStoreTarget === store || attemptedStores.has(store)) {
    return;
  }
  attemptedStores.add(store);

  try {
    if (typeof store.isDeveloper === 'function') {
      unpatchStoreFn = instead(store, 'isDeveloper', () => true);
      patchedStoreTarget = store;
      return;
    }

    const ownDesc = Object.getOwnPropertyDescriptor(store, 'isDeveloper');
    if (ownDesc) {
      if (ownDesc.configurable) {
        hadOwnDescriptor = true;
        previousOwnDescriptor = ownDesc;
        Object.defineProperty(store, 'isDeveloper', {
          configurable: true,
          enumerable: ownDesc.enumerable ?? true,
          get: () => true,
        });
        patchedStoreTarget = store;
        return;
      }
      if ('writable' in ownDesc && ownDesc.writable) {
        wroteWritableField = true;
        previousWritableValue = ownDesc.value;
        store.isDeveloper = true;
        patchedStoreTarget = store;
        return;
      }
    } else if (Object.isExtensible(store)) {
      hadOwnDescriptor = false;
      Object.defineProperty(store, 'isDeveloper', {
        configurable: true,
        enumerable: true,
        get: () => true,
      });
      patchedStoreTarget = store;
      return;
    }

    const proto = Object.getPrototypeOf(store);
    const protoDesc = proto ? Object.getOwnPropertyDescriptor(proto, 'isDeveloper') : undefined;
    if (proto && protoDesc?.configurable) {
      previousProtoDescriptor = protoDesc;
      Object.defineProperty(proto, 'isDeveloper', {
        configurable: true,
        enumerable: protoDesc.enumerable ?? true,
        get: () => true,
      });
      patchedProtoTarget = proto;
      patchedStoreTarget = store;
    }
  } catch {
    // Some Discord builds lock DeveloperExperimentStore.isDeveloper; predicate override handles settings access.
  }
}

function patchStaffPredicate(mod: any): void {
  if (unpatchPredicateFn || typeof mod?.useIsStaffOrDeveloperSettingPredicate !== 'function') {
    return;
  }
  try {
    unpatchPredicateFn = instead(mod, 'useIsStaffOrDeveloperSettingPredicate', () => true);
  } catch {
    // Ignore read-only exports.
  }
}

function tryPatchStores(): void {
  const devExpStore = findByStoreName('DeveloperExperimentStore');
  if (devExpStore) {
    patchDevExperimentStore(devExpStore);
  }
  getStore('ExperimentStore');
}

function onConnectionOpen(): void {
  tryPatchStores();
}

/**
 * Reports whether Discord's hidden Experiments override is active.
 */
export function isExperimentsActive(): boolean {
  const store = findByStoreName<any>('DeveloperExperimentStore');
  if (store) {
    try {
      const val = typeof store.isDeveloper === 'function' ? store.isDeveloper() : store.isDeveloper;
      if (val) {
        return true;
      }
    } catch {
      // Fall through to hook check.
    }
  }
  return Boolean(patchedStoreTarget || unpatchPredicateFn);
}

export default definePlugin({
  start() {
    tryPatchStores();

    if (!patchedStoreTarget) {
      cancelStoreWait = waitForStore('DeveloperExperimentStore', (store) => {
        patchDevExperimentStore(store);
      });
    }

    const predicateMod = findByProps('useIsStaffOrDeveloperSettingPredicate');
    if (predicateMod) {
      patchStaffPredicate(predicateMod);
    } else {
      cancelPredicateWait = waitFor(
        (m) =>
          typeof m === 'object' &&
          m !== null &&
          typeof m.useIsStaffOrDeveloperSettingPredicate === 'function',
        patchStaffPredicate,
      );
    }

    cancelDispatcherWait = onFluxDispatcher((dispatcher) => {
      if (!subscribedDispatcher) {
        subscribedDispatcher = dispatcher;
        dispatcher.subscribe('CONNECTION_OPEN', onConnectionOpen);
      }
    });
  },

  stop() {
    if (cancelStoreWait) {
      cancelStoreWait();
      cancelStoreWait = null;
    }
    if (cancelPredicateWait) {
      cancelPredicateWait();
      cancelPredicateWait = null;
    }
    if (cancelDispatcherWait) {
      cancelDispatcherWait();
      cancelDispatcherWait = null;
    }
    if (subscribedDispatcher) {
      subscribedDispatcher.unsubscribe('CONNECTION_OPEN', onConnectionOpen);
      subscribedDispatcher = null;
    }
    if (unpatchPredicateFn) {
      unpatchPredicateFn();
      unpatchPredicateFn = null;
    }
    if (unpatchStoreFn) {
      unpatchStoreFn();
      unpatchStoreFn = null;
    }
    if (patchedProtoTarget && previousProtoDescriptor) {
      try {
        Object.defineProperty(patchedProtoTarget, 'isDeveloper', previousProtoDescriptor);
      } catch {
        // Ignore locked prototypes.
      }
    } else if (patchedStoreTarget && !unpatchStoreFn) {
      try {
        if (wroteWritableField) {
          patchedStoreTarget.isDeveloper = previousWritableValue;
        } else if (hadOwnDescriptor && previousOwnDescriptor) {
          Object.defineProperty(patchedStoreTarget, 'isDeveloper', previousOwnDescriptor);
        } else {
          delete patchedStoreTarget.isDeveloper;
        }
      } catch {
        // Ignore non-configurable properties on cleanup.
      }
    }
    patchedStoreTarget = null;
    patchedProtoTarget = null;
    hadOwnDescriptor = false;
    previousOwnDescriptor = undefined;
    previousProtoDescriptor = undefined;
    wroteWritableField = false;
    previousWritableValue = undefined;
    attemptedStores = new WeakSet<object>();
  },
});
