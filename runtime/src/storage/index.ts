import { getCacheModule, getReactNative, onReactAndNative } from '../metro/common.js';
import { findByProps } from '../metro/index.js';

const STORAGE_KEY = 'nekocord:settings:v1';
const LEGACY_STORAGE_KEY = 'purrcord:settings:v1';
export const DEFAULT_UPDATE_SOURCE = 'flufstails/nekocord';

const LEGACY_PLUGIN_KEY_REMAP: Record<string, string> = {
  PurrcordBanner: 'NekocordBanner',
  PurrcordSettingsUI: 'NekocordSettingsUI',
};

type CacheApi = NonNullable<ReturnType<typeof getCacheModule>>;

function isCacheApi(candidate: unknown): candidate is CacheApi {
  if (!candidate || typeof candidate !== 'object') {
    return false;
  }
  const mod = candidate as { getItem?: unknown; setItem?: unknown };
  return typeof mod.getItem === 'function' && typeof mod.setItem === 'function';
}

function resolveCacheModule(): CacheApi | undefined {
  const rn = getReactNative();
  const candidates: unknown[] = [
    getCacheModule(),
    rn?.TurboModuleRegistry?.get?.('NativeCacheModule'),
    rn?.NativeModules?.NativeCacheModule,
    (globalThis as Record<string, any>).nativeModuleProxy?.NativeCacheModule,
    findByProps('getItem', 'setItem', 'removeItem', 'refresh'),
  ];
  return candidates.find(isCacheApi);
}

export interface StoredNekocordTheme {
  id: string;
  name: string;
  description?: string;
  authors?: string[];
  spec?: number;
  sourceUrl?: string;
  baseMode?: 'dark' | 'light';
  preview?: string[];
  semanticColors?: Record<string, Array<string | null> | string>;
  rawColors?: Record<string, string>;
}

export type StoredPurrcordTheme = StoredNekocordTheme;

export interface NekocordSettings {
  plugins: Record<string, { enabled: boolean }>;
  activeThemeId?: string | null;
  customThemes?: StoredNekocordTheme[];
  updateSource?: string;
}

export type PurrcordSettings = NekocordSettings;

const state: NekocordSettings = {
  plugins: {},
  activeThemeId: null,
  customThemes: [],
  updateSource: DEFAULT_UPDATE_SOURCE,
};

const dirtyPlugins = new Set<string>();
let dirtyActiveTheme = false;
let dirtyCustomThemes = false;
let dirtyUpdateSource = false;
let hydrated = false;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch (err) {
      console.error('[Nekocord/Storage] Listener error:', err);
    }
  }
}

function persist(): void {
  try {
    const cache = resolveCacheModule();
    if (!cache?.setItem) {
      console.warn('[Nekocord/Storage] NativeCacheModule.setItem unavailable; settings not persisted');
      return;
    }
    cache.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[Nekocord/Storage] Failed to persist settings:', err);
  }
}

function applyParsedSettings(
  parsed: Partial<NekocordSettings> | null,
  fromLegacy: boolean,
): void {
  if (!parsed || typeof parsed !== 'object') {
    return;
  }
  if (parsed.plugins && typeof parsed.plugins === 'object') {
    for (const [rawName, entry] of Object.entries(parsed.plugins)) {
      const name = fromLegacy ? (LEGACY_PLUGIN_KEY_REMAP[rawName] ?? rawName) : rawName;
      if (!dirtyPlugins.has(name) && entry && typeof entry.enabled === 'boolean') {
        state.plugins[name] = { enabled: entry.enabled };
      }
    }
  }
  if (
    !dirtyActiveTheme &&
    (parsed.activeThemeId === null || typeof parsed.activeThemeId === 'string')
  ) {
    state.activeThemeId = parsed.activeThemeId;
  }
  if (!dirtyCustomThemes && Array.isArray(parsed.customThemes)) {
    state.customThemes = parsed.customThemes.filter(
      (item): item is StoredNekocordTheme =>
        Boolean(item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string'),
    );
  }
  if (!dirtyUpdateSource && typeof parsed.updateSource === 'string') {
    const trimmed = parsed.updateSource.trim();
    if (trimmed) {
      state.updateSource = trimmed;
    } else if (fromLegacy) {
      state.updateSource = DEFAULT_UPDATE_SOURCE;
    }
  }
}

function attemptHydrate(onHydrated?: (settings: NekocordSettings) => void): boolean {
  try {
    const cache = resolveCacheModule();
    if (!cache?.getItem) {
      return false;
    }
    cache
      .getItem(STORAGE_KEY)
      .then(async (raw) => {
        if (raw) {
          console.log('[Nekocord/Storage] Hydrated settings from nekocord:settings:v1');
          const parsed = JSON.parse(raw) as Partial<NekocordSettings> | null;
          applyParsedSettings(parsed, false);
          notifyListeners();
          onHydrated?.(state);
          return;
        }

        const legacyRaw = await cache.getItem(LEGACY_STORAGE_KEY).catch(() => null);
        if (legacyRaw) {
          console.log('[Nekocord/Storage] Migrating legacy settings from purrcord:settings:v1');
          const legacyParsed = JSON.parse(legacyRaw) as Partial<NekocordSettings> | null;
          applyParsedSettings(legacyParsed, true);
          persist();
          notifyListeners();
          onHydrated?.(state);
          return;
        }

        console.log('[Nekocord/Storage] Initialized fresh settings');
        onHydrated?.(state);
      })
      .catch((err) => {
        console.error('[Nekocord/Storage] Failed to load settings:', err);
      });
    return true;
  } catch (err) {
    console.error('[Nekocord/Storage] NativeCacheModule unavailable:', err);
    return false;
  }
}

/**
 * Hydrates persisted settings asynchronously from Discord's {@code NativeCacheModule}.
 */
export function hydrateSettings(onHydrated?: (settings: NekocordSettings) => void): void {
  if (hydrated) {
    return;
  }
  hydrated = true;

  if (attemptHydrate(onHydrated)) {
    return;
  }

  let attempts = 0;
  const maxAttempts = 20;
  const retry = () => {
    if (attemptHydrate(onHydrated)) {
      return;
    }
    attempts += 1;
    if (attempts < maxAttempts) {
      setTimeout(retry, 250);
    } else {
      console.warn('[Nekocord/Storage] NativeCacheModule unavailable after startup; using defaults');
    }
  };
  onReactAndNative(() => {
    setTimeout(retry, 0);
  });
}

export function getSettings(): NekocordSettings {
  return state;
}

export function isPluginEnabled(name: string, defaultEnabled: boolean): boolean {
  const entry = state.plugins[name];
  return entry !== undefined ? entry.enabled : defaultEnabled;
}

export function setPluginEnabled(name: string, enabled: boolean): void {
  dirtyPlugins.add(name);
  state.plugins[name] = { enabled };
  persist();
  notifyListeners();
}

export function getActiveThemeId(): string | null {
  return state.activeThemeId ?? null;
}

export function setActiveThemeId(id: string | null): void {
  dirtyActiveTheme = true;
  state.activeThemeId = id;
  persist();
  notifyListeners();
}

export function getCustomThemes(): StoredNekocordTheme[] {
  return state.customThemes ? [...state.customThemes] : [];
}

export function addCustomTheme(theme: StoredNekocordTheme): void {
  dirtyCustomThemes = true;
  const current = state.customThemes ?? [];
  const idx = current.findIndex((item) => item.id === theme.id);
  if (idx >= 0) {
    current[idx] = theme;
  } else {
    current.push(theme);
  }
  state.customThemes = current;
  persist();
  notifyListeners();
}

export function removeCustomTheme(id: string): void {
  dirtyCustomThemes = true;
  const current = state.customThemes ?? [];
  state.customThemes = current.filter((item) => item.id !== id);
  if (state.activeThemeId === id) {
    dirtyActiveTheme = true;
    state.activeThemeId = null;
  }
  persist();
  notifyListeners();
}

export function getUpdateSource(): string {
  return state.updateSource?.trim() ? state.updateSource : DEFAULT_UPDATE_SOURCE;
}

export function setUpdateSource(source: string): void {
  dirtyUpdateSource = true;
  state.updateSource = source.trim() || DEFAULT_UPDATE_SOURCE;
  persist();
  notifyListeners();
}

export function updateSettings(partial: Partial<NekocordSettings>): void {
  if (partial.plugins) {
    for (const [name, entry] of Object.entries(partial.plugins)) {
      dirtyPlugins.add(name);
      state.plugins[name] = { enabled: Boolean(entry?.enabled) };
    }
  }
  if (partial.activeThemeId !== undefined) {
    dirtyActiveTheme = true;
    state.activeThemeId = partial.activeThemeId;
  }
  if (partial.customThemes !== undefined) {
    dirtyCustomThemes = true;
    state.customThemes = [...partial.customThemes];
  }
  if (partial.updateSource !== undefined) {
    dirtyUpdateSource = true;
    state.updateSource = partial.updateSource;
  }
  persist();
  notifyListeners();
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
