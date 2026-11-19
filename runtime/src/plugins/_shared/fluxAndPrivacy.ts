import {
  getStore,
  getUserStore,
  onFluxDispatcher,
  onMessageActions,
  type FluxDispatcher,
} from '../../metro/common.js';
import {
  findByProps,
  waitFor,
  waitForStore,
  watchNamedExports,
} from '../../metro/index.js';
import { after, instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin, type PluginImplementation } from '../types.js';

export function cloneWithPrototype<T extends object>(source: T, patch: Record<string, any>): T {
  const proto = Object.getPrototypeOf(source);
  const clone =
    proto && proto !== Object.prototype
      ? Object.assign(Object.create(proto), source)
      : { ...source };
  Object.assign(clone, patch);
  return clone as T;
}

export function createDispatcherBlockerPlugin(
  shouldBlock: (action: Record<string, any>) => boolean,
): PluginImplementation {
  return createDispatcherInterceptorPlugin((action) => !shouldBlock(action));
}

/**
 * Intercepts FluxDispatcher.dispatch; return {@code false} to suppress an action
 * or mutate it in place before letting it proceed.
 */
export function createDispatcherInterceptorPlugin(
  onDispatch: (action: Record<string, any>) => boolean | void,
): PluginImplementation {
  let cancelWait: (() => void) | null = null;
  let unpatch: Unpatch | null = null;

  return definePlugin({
    start() {
      cancelWait = onFluxDispatcher((dispatcher: FluxDispatcher) => {
        if (unpatch) return;
        unpatch = instead(dispatcher, 'dispatch', (args, orig) => {
          const action = args[0] as Record<string, any> | undefined;
          if (action && typeof action.type === 'string' && onDispatch(action) === false) {
            return undefined;
          }
          return orig(...args);
        });
      });
    },

    stop() {
      cancelWait?.();
      cancelWait = null;
      unpatch?.();
      unpatch = null;
    },
  });
}

export function createDispatcherObserverPlugin(
  event: string,
  onEvent?: (action: Record<string, any>) => void,
): PluginImplementation {
  let cancelWait: (() => void) | null = null;
  let subscribedDispatcher: FluxDispatcher | null = null;

  const handler = (action: Record<string, any>) => {
    onEvent?.(action);
  };

  return definePlugin({
    start() {
      cancelWait = onFluxDispatcher((dispatcher) => {
        if (!subscribedDispatcher) {
          subscribedDispatcher = dispatcher;
          dispatcher.subscribe(event, handler);
        }
      });
    },

    stop() {
      cancelWait?.();
      cancelWait = null;
      if (subscribedDispatcher) {
        subscribedDispatcher.unsubscribe(event, handler);
        subscribedDispatcher = null;
      }
    },
  });
}

export function createProfileFieldStripPlugin(
  field: string,
  replacement: any,
): PluginImplementation {
  let cancelWait: (() => void) | null = null;
  const unpatches: Unpatch[] = [];
  let hooked = false;

  return definePlugin({
    start() {
      cancelWait = waitForStore('UserProfileStore', (store) => {
        if (hooked) return;
        for (const method of ['getUserProfile', 'getGuildMemberProfile'] as const) {
          if (typeof store[method] !== 'function') continue;
          try {
            const u = after(store, method, (_args: any[], profile: any) => {
              if (!profile || typeof profile !== 'object') return profile;
              const current = profile[field];
              if (current === undefined || current === null || current === replacement) {
                return profile;
              }
              return cloneWithPrototype(profile, { [field]: replacement });
            });
            unpatches.push(u);
            hooked = true;
          } catch {
            // Skip locked methods.
          }
        }
      });
    },

    stop() {
      cancelWait?.();
      cancelWait = null;
      while (unpatches.length > 0) unpatches.pop()?.();
      hooked = false;
    },
  });
}

export function createNamedOverridePlugin(
  targets: string[],
  returnValue: any,
): PluginImplementation {
  let cancelWatch: (() => void) | null = null;
  const unpatches: Unpatch[] = [];
  const targetSet = new Set(targets);

  return definePlugin({
    start() {
      cancelWatch = watchNamedExports(targetSet, (hit) => {
        try {
          unpatches.push(instead(hit.target, hit.key, () => returnValue));
        } catch {
          // Ignore locked exports.
        }
      });
    },

    stop() {
      cancelWatch?.();
      cancelWatch = null;
      while (unpatches.length > 0) unpatches.pop()?.();
    },
  });
}

export function createZeroStoreMethodPlugin(
  storeName: string,
  methodNames: string[],
  returnValue: any,
): PluginImplementation {
  let cancelWait: (() => void) | null = null;
  const unpatches: Unpatch[] = [];
  let hooked = false;

  return definePlugin({
    start() {
      cancelWait = waitForStore(storeName, (store) => {
        if (hooked) return;
        for (const method of methodNames) {
          if (typeof store[method] === 'function') {
            try {
              unpatches.push(instead(store, method, () => returnValue));
              hooked = true;
            } catch {
              // Skip locked store methods.
            }
          }
        }
      });
    },

    stop() {
      cancelWait?.();
      cancelWait = null;
      while (unpatches.length > 0) unpatches.pop()?.();
      hooked = false;
    },
  });
}

export function createForceNitroVisualsPlugin(): PluginImplementation {
  let cancelWait: (() => void) | null = null;
  let unpatch: Unpatch | null = null;

  return definePlugin({
    start() {
      const hookStore = (store: any) => {
        if (unpatch || typeof store?.getCurrentUser !== 'function') return;
        unpatch = after(store, 'getCurrentUser', (_args: any[], user: any) => {
          if (!user || typeof user !== 'object' || user.premiumType === 2) return user;
          return cloneWithPrototype(user, { premiumType: 2 });
        });
      };

      const existing = getUserStore();
      if (existing) hookStore(existing);
      else cancelWait = waitForStore('UserStore', hookStore);
    },

    stop() {
      cancelWait?.();
      cancelWait = null;
      unpatch?.();
      unpatch = null;
    },
  });
}

export function createSuppressReadReceiptsPlugin(): PluginImplementation {
  let cancelWait: (() => void) | null = null;
  const unpatches: Unpatch[] = [];

  const hookAckMod = (mod: any) => {
    for (const method of ['ack', 'bulkAck', 'ackCategory'] as const) {
      if (typeof mod[method] === 'function') {
        try {
          unpatches.push(instead(mod, method, () => Promise.resolve()));
        } catch {
          // Ignore locked ack exports.
        }
      }
    }
  };

  return definePlugin({
    start() {
      const existing = findByProps('ack', 'bulkAck');
      if (existing) {
        hookAckMod(existing);
      } else {
        cancelWait = waitFor(
          (m) =>
            typeof m === 'object' &&
            m !== null &&
            typeof m.ack === 'function' &&
            typeof m.bulkAck === 'function',
          hookAckMod,
        );
      }
    },

    stop() {
      cancelWait?.();
      cancelWait = null;
      while (unpatches.length > 0) unpatches.pop()?.();
    },
  });
}

export function createReplyPingPlugin(forceMention: boolean): PluginImplementation {
  let cancelWait: (() => void) | null = null;
  let unpatch: Unpatch | null = null;

  return definePlugin({
    start() {
      cancelWait = onFluxDispatcher((dispatcher) => {
        if (unpatch) return;
        unpatch = instead(dispatcher, 'dispatch', (args, orig) => {
          const action = args[0] as Record<string, any> | undefined;
          if (action?.type === 'CREATE_PENDING_REPLY') {
            action.shouldMention = forceMention;
          }
          return orig(...args);
        });
      });
    },

    stop() {
      cancelWait?.();
      cancelWait = null;
      unpatch?.();
      unpatch = null;
    },
  });
}

export function createVoiceActionOnSelectPlugin(
  onJoinOnly: boolean,
  actionMethod: 'toggleSelfDeaf' | 'toggleSelfMute',
  checkStoreMethod: 'isSelfDeaf' | 'isSelfMute',
  desiredState: boolean,
): PluginImplementation {
  let cancelWait: (() => void) | null = null;
  let subscribedDispatcher: FluxDispatcher | null = null;
  let pendingTimer: ReturnType<typeof setTimeout> | null = null;

  const onVoiceSelect = (action: Record<string, any>) => {
    const joined = action.channelId != null;
    if (onJoinOnly !== joined) return;
    if (pendingTimer) {
      clearTimeout(pendingTimer);
    }
    pendingTimer = setTimeout(() => {
      pendingTimer = null;
      if (!subscribedDispatcher) return;
      const mediaStore = getStore<any>('MediaEngineStore');
      const current = Boolean(mediaStore?.[checkStoreMethod]?.());
      const shouldToggle = desiredState ? !current : current;
      if (!shouldToggle) return;
      const voiceActions = findByProps('toggleSelfMute', 'toggleSelfDeaf');
      if (typeof voiceActions?.[actionMethod] === 'function') {
        voiceActions[actionMethod]();
      }
    }, 0);
  };

  return definePlugin({
    start() {
      cancelWait = onFluxDispatcher((dispatcher) => {
        if (!subscribedDispatcher) {
          subscribedDispatcher = dispatcher;
          dispatcher.subscribe('VOICE_CHANNEL_SELECT', onVoiceSelect);
        }
      });
    },

    stop() {
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        pendingTimer = null;
      }
      cancelWait?.();
      cancelWait = null;
      if (subscribedDispatcher) {
        subscribedDispatcher.unsubscribe('VOICE_CHANNEL_SELECT', onVoiceSelect);
        subscribedDispatcher = null;
      }
    },
  });
}

export function createMessageActionHookPlugin(
  patchActions: (actions: any) => Unpatch[],
): PluginImplementation {
  let cancelWait: (() => void) | null = null;
  const unpatches: Unpatch[] = [];

  return definePlugin({
    start() {
      cancelWait = onMessageActions((actions) => {
        if (unpatches.length > 0) return;
        const created = patchActions(actions);
        unpatches.push(...created);
      });
    },

    stop() {
      cancelWait?.();
      cancelWait = null;
      while (unpatches.length > 0) unpatches.pop()?.();
    },
  });
}
