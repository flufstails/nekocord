export interface MetroModuleRecord {
  id: number | string;
  deps?: ReadonlyArray<number | string>;
  factory: MetroFactory;
  module?: { exports: unknown };
  initialized: boolean;
}

export type MetroFactory = (
  global: typeof globalThis,
  require: MetroRequire,
  importDefault: (moduleId: number | string) => unknown,
  importAll: (moduleId: number | string) => unknown,
  moduleObject: { exports: unknown },
  exports: Record<string, unknown>,
  dependencyMap?: ReadonlyArray<number | string>,
) => void;

export type MetroDefine = (
  factory: MetroFactory,
  moduleId: number | string,
  dependencyMap?: ReadonlyArray<number | string>,
) => void;

export type MetroRequire = ((moduleId: number | string) => unknown) & {
  c?: Record<string | number, { exports: unknown; isInitialized?: boolean }>;
};

export interface NekocordPreloadState {
  installedAt: number;
  hookedDefine: boolean;
  hookedRequire: boolean;
  hookedChatModule: boolean;
  interceptedAppRegistry: boolean;
  initializedCount: number;
  initializedRecords: MetroModuleRecord[];
  rootWrapper: ((OriginalComponent: any) => any) | null;
  chatUpdateRowsHook: ((args: any[]) => void) | null;
  factories: Map<number | string, MetroModuleRecord>;
  listeners: Set<(record: MetroModuleRecord) => void>;
  require: MetroRequire | null;
  define: MetroDefine | null;
  requireModule(id: number | string): unknown;
}

type TurboModuleProxyFn = (name: string, ...args: unknown[]) => any;

declare global {
  // eslint-disable-next-line no-var
  var __NEKOCORD_PRELOAD__: NekocordPreloadState | undefined;
  // eslint-disable-next-line no-var
  var __PURRCORD_PRELOAD__: NekocordPreloadState | undefined;
}

(function installNekocordPreload() {
  if (globalThis.__NEKOCORD_PRELOAD__) {
    return;
  }

  const hookedRegistries = new WeakSet<object>();
  const wrappedChatModules = new WeakMap<object, any>();
  let lastRawChatModule: unknown = null;
  let lastWrappedChatModule: unknown = null;
  let inUpdateRows = false;

  const CANARY_PROP = '__nekocord_nonexistent_canary__';

  function isCatchAllProxy(obj: any): boolean {
    if (obj == null || (typeof obj !== 'object' && typeof obj !== 'function')) {
      return false;
    }
    try {
      if (Object.prototype.hasOwnProperty.call(obj, CANARY_PROP)) {
        return true;
      }
      if (CANARY_PROP in obj) {
        return true;
      }
      if (obj[CANARY_PROP] !== undefined) {
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  const state: NekocordPreloadState = {
    installedAt: Date.now(),
    hookedDefine: false,
    hookedRequire: false,
    hookedChatModule: false,
    interceptedAppRegistry: false,
    initializedCount: 0,
    initializedRecords: [],
    rootWrapper: null,
    chatUpdateRowsHook: null,
    factories: new Map(),
    listeners: new Set(),
    require: null,
    define: null,
    requireModule(id: number | string): unknown {
      const req =
        state.require ??
        ((globalThis as Record<string, unknown>).__r as MetroRequire | undefined);
      if (typeof req !== 'function') {
        return undefined;
      }
      try {
        return req(id);
      } catch {
        return undefined;
      }
    },
  };

  globalThis.__NEKOCORD_PRELOAD__ = state;
  globalThis.__PURRCORD_PRELOAD__ = state;

  function maybeHookAppRegistry(exportsObj: any): void {
    if (
      state.interceptedAppRegistry ||
      exportsObj == null ||
      (typeof exportsObj !== 'object' && typeof exportsObj !== 'function')
    ) {
      return;
    }
    const candidates = [exportsObj, exportsObj?.default, exportsObj?.AppRegistry];
    for (const reg of candidates) {
      if (
        reg == null ||
        (typeof reg !== 'object' && typeof reg !== 'function') ||
        hookedRegistries.has(reg)
      ) {
        continue;
      }
      try {
        const regKeys = Object.keys(reg);
        if (!regKeys.includes('registerComponent') || !regKeys.includes('runApplication')) {
          continue;
        }
        if (
          typeof reg.registerComponent === 'function' &&
          typeof reg.runApplication === 'function' &&
          !isCatchAllProxy(reg)
        ) {
          hookedRegistries.add(reg);
          const origRegister = reg.registerComponent;
          reg.registerComponent = function nekocordRegisterComponent(
            this: unknown,
            appKey: string,
            componentProvider: () => any,
            ...rest: unknown[]
          ) {
            if (appKey === 'Discord' && typeof componentProvider === 'function') {
              state.interceptedAppRegistry = true;
              console.log('[Nekocord/Preload] Intercepted AppRegistry.registerComponent("Discord")');
              const wrappedProvider = function nekocordWrappedProvider() {
                const Original = componentProvider();
                return state.rootWrapper ? state.rootWrapper(Original) : Original;
              };
              return origRegister.call(this, appKey, wrappedProvider, ...rest);
            }
            return origRegister.call(this, appKey, componentProvider, ...rest);
          };
        }
      } catch {
        // Skip locked exports.
      }
    }
  }

  function wrapFactory(
    factory: MetroFactory,
    moduleId: number | string,
    dependencyMap?: ReadonlyArray<number | string>,
  ): MetroFactory {
    const record: MetroModuleRecord = {
      id: moduleId,
      deps: dependencyMap,
      factory,
      initialized: false,
    };
    state.factories.set(moduleId, record);

    return function nekocordWrappedFactory(
      this: unknown,
      globalObj,
      requireFn,
      importDefault,
      importAll,
      moduleObject,
      exports,
      deps,
    ) {
      if (!state.require && typeof requireFn === 'function') {
        state.require = requireFn;
      }
      record.module = moduleObject;
      try {
        factory.call(
          this,
          globalObj,
          requireFn,
          importDefault,
          importAll,
          moduleObject,
          exports,
          deps,
        );
      } finally {
        if (!record.initialized) {
          record.initialized = true;
          state.initializedCount += 1;
          state.initializedRecords.push(record);
        }
        maybeHookAppRegistry(moduleObject.exports);
        maybeHookChatModuleExport(moduleObject);
        state.listeners.forEach((listener) => {
          try {
            listener(record);
          } catch (err) {
            console.error('[Nekocord/Preload] Listener error:', err);
          }
        });
      }
    };
  }

  const hookedProxies = new WeakSet<TurboModuleProxyFn>();
  const hookedChatExports = new WeakSet<object>();
  const hookedChatTargets = new WeakSet<object>();
  let loggedChatWrap = false;

  function runChatUpdateRowsHook(callArgs: any[]): void {
    if (!state.chatUpdateRowsHook || inUpdateRows) {
      return;
    }
    inUpdateRows = true;
    try {
      state.chatUpdateRowsHook(callArgs);
    } catch (err) {
      console.error('[Nekocord/Preload] chatUpdateRowsHook error:', err);
    } finally {
      inUpdateRows = false;
    }
  }

  function wrapNativeChatModule(mod: any, source: string): any {
    if (mod == null || (typeof mod !== 'object' && typeof mod !== 'function')) {
      return mod;
    }
    if (mod === lastWrappedChatModule) {
      return mod;
    }
    if (mod === lastRawChatModule && lastWrappedChatModule) {
      return lastWrappedChatModule;
    }
    try {
      const cached = wrappedChatModules.get(mod);
      if (cached) {
        return cached;
      }
    } catch {
      // HostObject may reject WeakMap keys.
    }

    try {
      const wrapped: Record<string, any> = {
        updateRows(...callArgs: any[]) {
          runChatUpdateRowsHook(callArgs);
          return mod.updateRows.apply(mod, callArgs);
        },
        clearRows(...callArgs: any[]) {
          return typeof mod.clearRows === 'function' ? mod.clearRows.apply(mod, callArgs) : undefined;
        },
        getConstants() {
          return typeof mod.getConstants === 'function' ? mod.getConstants() : {};
        },
      };
      lastRawChatModule = mod;
      lastWrappedChatModule = wrapped;
      try {
        wrappedChatModules.set(mod, wrapped);
      } catch {
        // Ignore WeakMap rejection on HostObject.
      }
      state.hookedChatModule = true;
      if (!loggedChatWrap) {
        loggedChatWrap = true;
        console.log(`[Nekocord/Preload] Wrapped NativeChatModule via ${source}`);
      }
      return wrapped;
    } catch (err) {
      console.error('[Nekocord/Preload] Failed to wrap NativeChatModule:', err);
      return mod;
    }
  }

  function wrapTurboProxyFn(originalProxy: TurboModuleProxyFn, source: string): TurboModuleProxyFn {
    if (typeof originalProxy !== 'function' || hookedProxies.has(originalProxy)) {
      return originalProxy;
    }
    const wrappedProxy: TurboModuleProxyFn = function nekocordTurboModuleProxy(
      this: unknown,
      name: string,
      ...rest: unknown[]
    ) {
      const mod = originalProxy.apply(this, [name, ...rest]);
      if (name !== 'NativeChatModule') {
        return mod;
      }
      return wrapNativeChatModule(mod, source);
    };
    hookedProxies.add(wrappedProxy);
    return wrappedProxy;
  }

  function maybeHookChatModuleExport(moduleObject: { exports: any }): void {
    const exp = moduleObject?.exports;
    if (exp == null || typeof exp !== 'object' || hookedChatExports.has(exp)) {
      return;
    }
    try {
      if (Object.getPrototypeOf(exp) !== Object.prototype) {
        return;
      }
      const keys = Object.keys(exp);
      if (keys.length > 5 || !Object.prototype.hasOwnProperty.call(exp, 'default')) {
        return;
      }
      const def = exp.default;
      if (
        def &&
        typeof def === 'object' &&
        def !== lastWrappedChatModule &&
        !hookedChatTargets.has(def) &&
        typeof def.updateRows === 'function' &&
        typeof def.clearRows === 'function'
      ) {
        if (typeof def.registerComponent === 'function' || isCatchAllProxy(def)) {
          hookedChatExports.add(exp);
          return;
        }
        hookedChatExports.add(exp);
        try {
          hookedChatTargets.add(def);
        } catch {
          // Ignore non-extensible target WeakSet rejection.
        }
        let defKeys: string[] = [];
        try {
          defKeys = Object.keys(def);
        } catch {
          defKeys = [];
        }

        const origUpdateRows = def.updateRows;
        const wrappedUpdateRows = function nekocordUpdateRowsInPlace(
          this: unknown,
          ...callArgs: any[]
        ) {
          runChatUpdateRowsHook(callArgs);
          return origUpdateRows.apply(this ?? def, callArgs);
        };

        let inPlaceWorked = false;
        try {
          def.updateRows = wrappedUpdateRows;
          inPlaceWorked = def.updateRows === wrappedUpdateRows;
        } catch {
          inPlaceWorked = false;
        }

        if (inPlaceWorked) {
          state.hookedChatModule = true;
        } else {
          exp.default = wrapNativeChatModule(def, 'NativeChatModule.exports.default');
        }
        console.log(
          `[Nekocord/Preload] Hooked chat module (keys=[${defKeys.join(',')}], inPlace=${inPlaceWorked})`,
        );
      }
    } catch {
      // Skip locked or hostile exports.
    }
  }

  function hookGlobalProperty<T>(
    key: string,
    onAssign: (value: T) => T,
    onHooked: () => void,
  ): void {
    let current: T | undefined = (globalThis as Record<string, unknown>)[key] as T | undefined;
    if (current !== undefined) {
      current = onAssign(current);
      onHooked();
    }

    try {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        enumerable: true,
        get() {
          return current;
        },
        set(next: T) {
          current = onAssign(next);
          onHooked();
        },
      });
    } catch (err) {
      if (current !== undefined) {
        try {
          (globalThis as Record<string, unknown>)[key] = current;
          return;
        } catch {
          // Fall through to error log.
        }
      }
      console.error(`[Nekocord/Preload] Failed to trap ${key}:`, err);
    }
  }

  hookGlobalProperty<MetroDefine>(
    '__d',
    (originalDefine) => {
      if (typeof originalDefine !== 'function') {
        return originalDefine;
      }
      state.define = originalDefine;
      const wrappedDefine: MetroDefine = (factory, moduleId, dependencyMap) => {
        if (typeof factory !== 'function') {
          return originalDefine(factory, moduleId, dependencyMap);
        }
        return originalDefine(
          wrapFactory(factory, moduleId, dependencyMap),
          moduleId,
          dependencyMap,
        );
      };
      return wrappedDefine;
    },
    () => {
      state.hookedDefine = true;
    },
  );

  hookGlobalProperty<MetroRequire>(
    '__r',
    (originalRequire) => {
      if (typeof originalRequire === 'function') {
        state.require = originalRequire;
      }
      return originalRequire;
    },
    () => {
      state.hookedRequire = true;
    },
  );

  hookGlobalProperty<TurboModuleProxyFn>(
    '__turboModuleProxy',
    (originalProxy) => wrapTurboProxyFn(originalProxy, '__turboModuleProxy'),
    () => {
      // NativeChatModule wrapping sets state.hookedChatModule lazily on access.
    },
  );
})();
