import type { MetroModuleRecord, MetroRequire, NekocordPreloadState } from '../preload.js';

export type ModuleFilter = (exports: any) => boolean;

const CANARY_PROP = '__nekocord_nonexistent_canary__';
const hasOwn = Object.prototype.hasOwnProperty;

export function isCatchAllProxy(obj: any): boolean {
  if (obj == null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return false;
  }
  try {
    if (hasOwn.call(obj, CANARY_PROP)) {
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

function getPreloadState(): NekocordPreloadState | null {
  return globalThis.__NEKOCORD_PRELOAD__ ?? globalThis.__PURRCORD_PRELOAD__ ?? null;
}

function resolveRequire(): MetroRequire | null {
  const state = getPreloadState();
  if (state?.require) {
    return state.require;
  }
  const candidate = (globalThis as Record<string, unknown>).__r;
  return typeof candidate === 'function' ? (candidate as MetroRequire) : null;
}

const cachedCandidates: unknown[] = [];
const cachedCandidateSet = new Set<unknown>();
let syncedRecordCount = 0;
let scannedInitialReqC = false;
const scannedReqCKeys = new Set<string>();
let sharedRouterAttached = false;

const propsCache = new Map<string, unknown>();
const nameCache = new Map<string, unknown>();
const displayNameCache = new Map<string, unknown>();

function collectModuleExportValues(
  exports: unknown,
  results: unknown[],
  seen?: Set<unknown>,
): void {
  if (exports == null || (typeof exports !== 'object' && typeof exports !== 'function')) {
    return;
  }

  const pushUnique = (val: unknown) => {
    if (val == null || (typeof val !== 'object' && typeof val !== 'function')) {
      return;
    }
    if (seen) {
      if (seen.has(val)) {
        return;
      }
      seen.add(val);
    }
    results.push(val);
  };

  pushUnique(exports);

  try {
    const proto = Object.getPrototypeOf(exports);
    const isPlain = proto === Object.prototype || proto === null;
    const keys = isPlain ? Object.keys(exports) : null;

    const defaultDesc = Object.getOwnPropertyDescriptor(exports, 'default');
    if (defaultDesc) {
      if ('value' in defaultDesc) {
        pushUnique(defaultDesc.value);
      } else if (typeof defaultDesc.get === 'function') {
        try {
          pushUnique((exports as { default?: unknown }).default);
        } catch {
          // Skip uninitialized default getter.
        }
      }
    }

    if (isPlain && keys && keys.length >= 1 && keys.length <= 20) {
      for (let i = 0; i < keys.length; i += 1) {
        const k = keys[i];
        if (k === 'default' || k === '__esModule') {
          continue;
        }
        try {
          const desc = Object.getOwnPropertyDescriptor(exports, k);
          if (desc && 'value' in desc) {
            pushUnique(desc.value);
          }
        } catch {
          // Skip getters or locked descriptors.
        }
      }
    }
  } catch {
    // Skip proxy/object inspection errors.
  }
}

export interface ComponentPatchTarget {
  target: Record<string, any>;
  key: string;
  matchedName: string;
}

interface NamedWatcherSub {
  names: ReadonlySet<string>;
  emittedTargets: WeakMap<object, Set<string>>;
  onMatch: (hit: ComponentPatchTarget) => void;
}

const namedWatchersByName = new Map<string, Set<NamedWatcherSub>>();

function resolveCallableTarget(
  val: any,
  container: Record<string, any>,
  prop: string,
  matchedName: string,
): ComponentPatchTarget | null {
  if (typeof val === 'function') {
    return { target: container, key: prop, matchedName };
  }
  if (val && typeof val === 'object') {
    if (typeof val.type === 'function') {
      return { target: val, key: 'type', matchedName };
    }
    if (typeof val.render === 'function') {
      return { target: val, key: 'render', matchedName };
    }
  }
  return null;
}

function getComponentCandidateNames(val: any): [unknown, unknown, unknown] | null {
  if (typeof val === 'function') {
    return [val.displayName, val.name, undefined];
  }
  if (val && typeof val === 'object') {
    if (typeof val.type === 'function') {
      return [val.displayName, val.type.displayName, val.type.name];
    }
    if (typeof val.render === 'function') {
      return [val.displayName, val.render.displayName, val.render.name];
    }
    return [val.displayName, undefined, undefined];
  }
  return null;
}

function emitToWatcher(sub: NamedWatcherSub, hit: ComponentPatchTarget): void {
  let seenKeys = sub.emittedTargets.get(hit.target);
  if (!seenKeys) {
    seenKeys = new Set<string>();
    sub.emittedTargets.set(hit.target, seenKeys);
  }
  if (seenKeys.has(hit.key)) {
    return;
  }
  seenKeys.add(hit.key);
  try {
    sub.onMatch(hit);
  } catch (err) {
    console.error('[Nekocord/Metro] watchNamedExports callback error:', err);
  }
}

function scanPlainContainerForWatchers(
  container: unknown,
  singleSub?: NamedWatcherSub,
): void {
  if (container == null || typeof container !== 'object') {
    return;
  }
  try {
    const proto = Object.getPrototypeOf(container);
    if (proto !== Object.prototype && proto !== null) {
      return;
    }
    const keys = Object.keys(container);
    if (keys.length < 1 || keys.length > 120 || isCatchAllProxy(container)) {
      return;
    }
    const rec = container as Record<string, any>;

    for (let i = 0; i < keys.length; i += 1) {
      const k = keys[i];
      if (k === '__esModule') {
        continue;
      }

      if (singleSub ? singleSub.names.has(k) : namedWatchersByName.has(k)) {
        try {
          const hit = resolveCallableTarget(rec[k], rec, k, k);
          if (hit) {
            if (singleSub) {
              emitToWatcher(singleSub, hit);
            } else {
              const subs = namedWatchersByName.get(k);
              if (subs) {
                subs.forEach((sub) => emitToWatcher(sub, hit));
              }
            }
          }
        } catch {
          // Ignore uninitialized export getters.
        }
        continue;
      }

      try {
        const desc = Object.getOwnPropertyDescriptor(rec, k);
        if (!desc) {
          continue;
        }
        let val: any;
        if ('value' in desc) {
          val = desc.value;
        } else if (k === 'default' && typeof desc.get === 'function') {
          val = rec.default;
        } else {
          continue;
        }
        const candidates = getComponentCandidateNames(val);
        if (!candidates) {
          continue;
        }
        for (let c = 0; c < candidates.length; c += 1) {
          const cname = candidates[c];
          if (typeof cname !== 'string') {
            continue;
          }
          if (singleSub) {
            if (singleSub.names.has(cname)) {
              const hit = resolveCallableTarget(val, rec, k, cname);
              if (hit) {
                emitToWatcher(singleSub, hit);
              }
              break;
            }
          } else {
            const subs = namedWatchersByName.get(cname);
            if (subs && subs.size > 0) {
              const hit = resolveCallableTarget(val, rec, k, cname);
              if (hit) {
                subs.forEach((sub) => emitToWatcher(sub, hit));
              }
              break;
            }
          }
        }
      } catch {
        // Ignore unready getters or locked properties.
      }
    }
  } catch {
    // Skip proxy/object inspection errors.
  }
}

function collectNamedExportsForWatchers(
  exportsObj: unknown,
  singleSub?: NamedWatcherSub,
): void {
  if (!singleSub && namedWatchersByName.size === 0) {
    return;
  }
  scanPlainContainerForWatchers(exportsObj, singleSub);
  if (exportsObj != null && typeof exportsObj === 'object') {
    try {
      const desc = Object.getOwnPropertyDescriptor(exportsObj, 'default');
      if (!desc) {
        return;
      }
      let defaultVal: unknown;
      if ('value' in desc) {
        defaultVal = desc.value;
      } else if (
        typeof desc.get === 'function' &&
        !isCatchAllProxy(exportsObj) &&
        Object.keys(exportsObj).length <= 120
      ) {
        defaultVal = (exportsObj as Record<string, any>).default;
      }
      if (defaultVal != null && typeof defaultVal === 'object') {
        scanPlainContainerForWatchers(defaultVal, singleSub);
      }
    } catch {
      // Ignore locked default export objects.
    }
  }
}

function ensureSharedPreloadRouter(): void {
  if (sharedRouterAttached) {
    return;
  }
  const state = getPreloadState();
  if (!state) {
    return;
  }
  sharedRouterAttached = true;
  state.listeners.add((record: MetroModuleRecord) => {
    const exportsObj = record.module?.exports;
    if (exportsObj != null) {
      collectModuleExportValues(exportsObj, cachedCandidates, cachedCandidateSet);
      syncedRecordCount = state.initializedRecords.length;
      if (namedWatchersByName.size > 0) {
        collectNamedExportsForWatchers(exportsObj);
      }
    }
  });
}

function syncExportCandidates(): void {
  const state = getPreloadState();
  if (state) {
    ensureSharedPreloadRouter();
    const records = state.initializedRecords;
    if (records && syncedRecordCount < records.length) {
      for (let i = syncedRecordCount; i < records.length; i += 1) {
        const rec = records[i];
        if (rec?.initialized && rec.module) {
          collectModuleExportValues(rec.module.exports, cachedCandidates, cachedCandidateSet);
        }
      }
      syncedRecordCount = records.length;
    } else if (!records && cachedCandidates.length === 0) {
      for (const record of state.factories.values()) {
        if (record.initialized && record.module) {
          collectModuleExportValues(record.module.exports, cachedCandidates, cachedCandidateSet);
        }
      }
    }
  }

  const req = resolveRequire();
  if (req?.c && (!state?.hookedDefine || !scannedInitialReqC)) {
    if (state?.hookedDefine) {
      scannedInitialReqC = true;
    }
    const keys = Object.keys(req.c);
    if (keys.length !== scannedReqCKeys.size) {
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (scannedReqCKeys.has(key)) {
          continue;
        }
        const mod = req.c[key];
        if (mod && mod.isInitialized !== false) {
          scannedReqCKeys.add(key);
          collectModuleExportValues(mod.exports, cachedCandidates, cachedCandidateSet);
        }
      }
    }
  }
}

function getExportCandidates(): unknown[] {
  syncExportCandidates();
  return cachedCandidates;
}

/**
 * Returns statistics about tracked Metro factories and initialized modules.
 */
export function getMetroStats(): { factories: number; initialized: number; hookedPreload: boolean } {
  const state = getPreloadState();
  if (state) {
    return {
      factories: state.factories.size,
      initialized: state.initializedCount ?? 0,
      hookedPreload: Boolean(state.hookedDefine),
    };
  }
  const req = resolveRequire();
  return {
    factories: 0,
    initialized: req?.c ? Object.keys(req.c).length : 0,
    hookedPreload: false,
  };
}

/**
 * Finds initialized Metro module exports matching {@code filter}.
 */
export function getModule<T = any>(filter: ModuleFilter): T | undefined {
  const candidates = getExportCandidates();
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    try {
      if (filter(candidate) && !isCatchAllProxy(candidate)) {
        return candidate as T;
      }
    } catch {
      // Skip hostile proxies or uninitialized getters.
    }
  }
  return undefined;
}

/**
 * Finds all initialized Metro module exports matching {@code filter}.
 */
export function getModules<T = any>(filter: ModuleFilter): T[] {
  const candidates = getExportCandidates();
  const matches: T[] = [];
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    try {
      if (filter(candidate) && !isCatchAllProxy(candidate)) {
        matches.push(candidate as T);
      }
    } catch {
      // Skip hostile proxies or uninitialized getters.
    }
  }
  return matches;
}

function hasPropKey(obj: any, prop: string): boolean {
  if (obj == null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return false;
  }
  try {
    const proto = Object.getPrototypeOf(obj);
    if (proto === Object.prototype || proto === null) {
      return hasOwn.call(obj, prop);
    }
    return prop in obj;
  } catch {
    return false;
  }
}

function hasPropDefined(obj: any, prop: string): boolean {
  if (!hasPropKey(obj, prop)) {
    return false;
  }
  try {
    return obj[prop] !== undefined;
  } catch {
    return false;
  }
}

/**
 * Finds a module exposing all listed property names with defined values.
 */
export function findByProps<T = any>(...props: string[]): T | undefined {
  if (props.length === 0) {
    return undefined;
  }
  const cacheKey = props.join('\0');
  if (propsCache.has(cacheKey)) {
    return propsCache.get(cacheKey) as T;
  }
  const hit = getModule<T>((m) => {
    for (let i = 0; i < props.length; i += 1) {
      if (!hasPropKey(m, props[i])) {
        return false;
      }
    }
    for (let i = 0; i < props.length; i += 1) {
      if (m[props[i]] === undefined) {
        return false;
      }
    }
    return true;
  });
  if (hit !== undefined) {
    propsCache.set(cacheKey, hit);
  }
  return hit;
}

/**
 * Finds a module by function or component {@code name} / {@code displayName}.
 */
export function findByName<T = any>(name: string): T | undefined {
  if (nameCache.has(name)) {
    return nameCache.get(name) as T;
  }
  const hit = getModule<T>(
    (m) =>
      (typeof m === 'function' && m.name === name) ||
      (hasPropDefined(m, 'displayName') && m.displayName === name),
  );
  if (hit !== undefined) {
    nameCache.set(name, hit);
  }
  return hit;
}

/**
 * Finds a React component by {@code displayName}, checking direct components,
 * {@code React.memo} wrappers ({@code type.displayName}), and {@code forwardRef} wrappers ({@code render.displayName}).
 */
export function findByDisplayName<T = any>(displayName: string): T | undefined {
  if (displayNameCache.has(displayName)) {
    return displayNameCache.get(displayName) as T;
  }
  const hit = getModule<T>((m) => {
    if (hasPropDefined(m, 'displayName') && m.displayName === displayName) {
      return true;
    }
    if (
      hasPropDefined(m, 'type') &&
      hasPropDefined(m.type, 'displayName') &&
      m.type.displayName === displayName
    ) {
      return true;
    }
    if (
      hasPropDefined(m, 'render') &&
      hasPropDefined(m.render, 'displayName') &&
      m.render.displayName === displayName
    ) {
      return true;
    }
    return false;
  });
  if (hit !== undefined) {
    displayNameCache.set(displayName, hit);
  }
  return hit;
}

/**
 * Resolves a React Native Bridgeless TurboModule by registered name.
 */
export function getTurboModule<T = any>(name: string): T | undefined {
  const proxy = (globalThis as Record<string, unknown>).__turboModuleProxy;
  if (typeof proxy !== 'function') {
    return undefined;
  }
  try {
    return (proxy as (moduleName: string) => T | null | undefined)(name) ?? undefined;
  } catch {
    return undefined;
  }
}

const storeCache = new Map<string, unknown>();
let cachedStoreClass: { getAll?: () => unknown[] } | null = null;

function isFluxStoreWithName(m: any, storeName: string): boolean {
  if (m == null || typeof m !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(m);
  if (proto == null || proto === Object.prototype || proto === Array.prototype) {
    return false;
  }
  const isStore =
    typeof m.addChangeListener === 'function' ||
    typeof m.addConditionalChangeListener === 'function' ||
    m._dispatcher != null ||
    m._changeCallbacks != null;
  if (!isStore) {
    return false;
  }
  if (typeof m.getName === 'function') {
    try {
      if (m.getName() === storeName) {
        return true;
      }
    } catch {
      // Ignore uninitialized store getters.
    }
  }
  return (
    m.constructor?.displayName === storeName ||
    m.displayName === storeName ||
    m._name === storeName
  );
}

/**
 * Finds a Flux store by its registered store name (for example {@code UserStore}).
 */
export function findByStoreName<T = any>(storeName: string): T | undefined {
  if (storeCache.has(storeName)) {
    return storeCache.get(storeName) as T;
  }

  if (!cachedStoreClass) {
    cachedStoreClass =
      getModule<{ getAll?: () => unknown[] }>(
        (m) =>
          typeof m === 'function' &&
          typeof m.getAll === 'function' &&
          typeof m.initialize === 'function',
      ) ?? null;
  }

  if (cachedStoreClass && typeof cachedStoreClass.getAll === 'function') {
    try {
      const allStores = cachedStoreClass.getAll();
      if (Array.isArray(allStores)) {
        for (let i = 0; i < allStores.length; i += 1) {
          const s = allStores[i];
          if (isFluxStoreWithName(s, storeName)) {
            storeCache.set(storeName, s);
            return s as T;
          }
        }
      }
    } catch {
      // Fall back to full module scan.
    }
  }

  const found = getModule<T>((m) => isFluxStoreWithName(m, storeName));
  if (found !== undefined) {
    storeCache.set(storeName, found);
  }
  return found;
}

/**
 * Invokes {@code callback} immediately if {@code storeName} is initialized, or once it loads.
 */
export function waitForStore<T = any>(
  storeName: string,
  callback: (store: T) => void,
): () => void {
  const existing = findByStoreName<T>(storeName);
  if (existing !== undefined) {
    callback(existing);
    return () => {};
  }
  return waitFor<T>(
    (m) => isFluxStoreWithName(m, storeName),
    (store) => {
      storeCache.set(storeName, store);
      callback(store);
    },
  );
}

/**
 * Invokes {@code callback} immediately if {@code filter} matches, or once a matching
 * module initializes later during Discord startup.
 */
export function waitFor<T = any>(filter: ModuleFilter, callback: (mod: T) => void): () => void {
  const existing = getModule<T>(filter);
  if (existing !== undefined) {
    callback(existing);
    return () => {};
  }

  const state = getPreloadState();
  if (!state) {
    return () => {};
  }

  ensureSharedPreloadRouter();

  const localCandidates: unknown[] = [];
  const listener = (record: MetroModuleRecord) => {
    const exports = record.module?.exports;
    if (exports == null) {
      return;
    }
    localCandidates.length = 0;
    collectModuleExportValues(exports, localCandidates);
    for (let i = 0; i < localCandidates.length; i += 1) {
      const candidate = localCandidates[i];
      let matched = false;
      try {
        matched = Boolean(filter(candidate)) && !isCatchAllProxy(candidate);
      } catch {
        // Ignore unready exports.
      }
      if (matched) {
        state.listeners.delete(listener);
        try {
          callback(candidate as T);
        } catch (err) {
          console.error('[Nekocord/Metro] waitFor callback error:', err);
        }
        return;
      }
    }
  };

  state.listeners.add(listener);
  return () => {
    state.listeners.delete(listener);
  };
}

/**
 * Watches initialized and future Metro modules for named exports or React components
 * whose key or {@code displayName}/{@code name} matches {@code names}.
 */
export function watchNamedExports(
  names: ReadonlySet<string>,
  onMatch: (hit: ComponentPatchTarget) => void,
): () => void {
  const sub: NamedWatcherSub = {
    names,
    emittedTargets: new WeakMap<object, Set<string>>(),
    onMatch,
  };

  const state = getPreloadState();
  if (state) {
    if (state.initializedRecords) {
      for (let i = 0; i < state.initializedRecords.length; i += 1) {
        const record = state.initializedRecords[i];
        if (record?.initialized && record.module) {
          collectNamedExportsForWatchers(record.module.exports, sub);
        }
      }
    } else {
      for (const record of state.factories.values()) {
        if (record.initialized && record.module) {
          collectNamedExportsForWatchers(record.module.exports, sub);
        }
      }
    }
  }

  const req = resolveRequire();
  if (req?.c && (!state?.hookedDefine || !scannedInitialReqC)) {
    for (const key of Object.keys(req.c)) {
      const mod = req.c[key];
      if (mod?.isInitialized !== false) {
        collectNamedExportsForWatchers(mod?.exports, sub);
      }
    }
  }

  if (!state) {
    return () => {};
  }

  ensureSharedPreloadRouter();
  names.forEach((name) => {
    let bucket = namedWatchersByName.get(name);
    if (!bucket) {
      bucket = new Set();
      namedWatchersByName.set(name, bucket);
    }
    bucket.add(sub);
  });

  return () => {
    names.forEach((name) => {
      const bucket = namedWatchersByName.get(name);
      if (bucket) {
        bucket.delete(sub);
        if (bucket.size === 0) {
          namedWatchersByName.delete(name);
        }
      }
    });
  };
}
