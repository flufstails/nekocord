import { onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { findByStoreName, waitForStore } from '../../metro/index.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let cancelStoreWait: (() => void) | null = null;
let cancelDispatcherWait: (() => void) | null = null;
let subscribedDispatcher: FluxDispatcher | null = null;
let unpatchStoreFn: Unpatch | null = null;
let patchedTarget: any = null;
let hadOwnDescriptor = false;
let previousOwnDescriptor: PropertyDescriptor | undefined;

function patchDevStore(store: any): void {
  if (!store || patchedTarget === store) {
    return;
  }

  try {
    if (typeof store.isDeveloper === 'function') {
      unpatchStoreFn = instead(store, 'isDeveloper', () => true);
      patchedTarget = store;
      console.log('[Nekocord/DeveloperMode] Enabled via DeveloperOptionsStore.isDeveloper()');
      return;
    }

    if ('isDeveloper' in store) {
      hadOwnDescriptor = Object.prototype.hasOwnProperty.call(store, 'isDeveloper');
      previousOwnDescriptor = hadOwnDescriptor
        ? Object.getOwnPropertyDescriptor(store, 'isDeveloper')
        : undefined;

      Object.defineProperty(store, 'isDeveloper', {
        configurable: true,
        enumerable: true,
        get: () => true,
      });
      patchedTarget = store;
      console.log('[Nekocord/DeveloperMode] Enabled via DeveloperOptionsStore.isDeveloper getter');
    }
  } catch (err) {
    console.error('[Nekocord/DeveloperMode] Failed to patch DeveloperOptionsStore:', err);
  }
}

function tryPatchExistingStore(): void {
  const store = findByStoreName('DeveloperOptionsStore');
  if (store) {
    patchDevStore(store);
  }
}

function onConnectionOpen(): void {
  tryPatchExistingStore();
}

export default definePlugin({
  start() {
    tryPatchExistingStore();

    if (!patchedTarget) {
      cancelStoreWait = waitForStore('DeveloperOptionsStore', (store) => {
        patchDevStore(store);
      });
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
    if (cancelDispatcherWait) {
      cancelDispatcherWait();
      cancelDispatcherWait = null;
    }
    if (subscribedDispatcher) {
      subscribedDispatcher.unsubscribe('CONNECTION_OPEN', onConnectionOpen);
      subscribedDispatcher = null;
    }
    if (unpatchStoreFn) {
      unpatchStoreFn();
      unpatchStoreFn = null;
    }
    if (patchedTarget && !unpatchStoreFn) {
      try {
        if (hadOwnDescriptor && previousOwnDescriptor) {
          Object.defineProperty(patchedTarget, 'isDeveloper', previousOwnDescriptor);
        } else {
          delete patchedTarget.isDeveloper;
        }
      } catch (err) {
        console.error('[Nekocord/DeveloperMode] Failed to restore DeveloperOptionsStore:', err);
      }
    }
    patchedTarget = null;
    hadOwnDescriptor = false;
    previousOwnDescriptor = undefined;
  },
});
