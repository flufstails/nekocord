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
  favoritePlugins?: string[];
  activeThemeId?: string | null;
  customThemes?: StoredNekocordTheme[];
  updateSource?: string;
}

export type PurrcordSettings = NekocordSettings;

const state: NekocordSettings = {
  plugins: {},
  favoritePlugins: [],
  activeThemeId: null,
  customThemes: [],
  updateSource: DEFAULT_UPDATE_SOURCE,
};

const dirtyPlugins = new Set<string>();
let dirtyFavorites = false;
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
  if (!dirtyFavorites && Array.isArray(parsed.favoritePlugins)) {
    const clean = new Set<string>();
    for (let i = 0; i < parsed.favoritePlugins.length; i += 1) {
      const item = parsed.favoritePlugins[i];
      if (typeof item === 'string' && item.trim()) {
        clean.add(fromLegacy ? (LEGACY_PLUGIN_KEY_REMAP[item] ?? item) : item);
      }
    }
    state.favoritePlugins = Array.from(clean);
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

export function getFavoritePlugins(): string[] {
  return state.favoritePlugins ? [...state.favoritePlugins] : [];
}

export function isFavoritePlugin(name: string): boolean {
  return Boolean(state.favoritePlugins?.includes(name));
}

export function toggleFavoritePlugin(name: string): boolean {
  dirtyFavorites = true;
  const current = new Set(state.favoritePlugins ?? []);
  const next = !current.has(name);
  if (next) {
    current.add(name);
  } else {
    current.delete(name);
  }
  state.favoritePlugins = Array.from(current);
  persist();
  notifyListeners();
  return next;
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
  if (partial.favoritePlugins !== undefined) {
    dirtyFavorites = true;
    state.favoritePlugins = [...partial.favoritePlugins];
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

/**
 * Serializes current Nekocord settings into a portable JSON backup envelope.
 */
export function exportSettingsJson(): string {
  return JSON.stringify(
    {
      nekocordVersion: globalThis.Nekocord?.version ?? '1.1.0',
      exportedAt: new Date().toISOString(),
      settings: {
        plugins: state.plugins,
        favoritePlugins: state.favoritePlugins ?? [],
        activeThemeId: state.activeThemeId ?? null,
        customThemes: state.customThemes ?? [],
        updateSource: getUpdateSource(),
      },
    },
    null,
    2,
  );
}

/**
 * Validates and imports a Nekocord settings backup JSON string, replacing current state.
 */
export function importSettingsJson(rawJson: string): {
  ok: boolean;
  message: string;
  pluginCount?: number;
  changedPlugins?: string[];
} {
  const trimmed = typeof rawJson === 'string' ? rawJson.trim() : '';
  if (!trimmed) {
    return { ok: false, message: 'Paste exported Nekocord settings JSON first.' };
  }

  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(trimmed);
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? `Invalid JSON: ${err.message}` : 'Invalid JSON syntax.',
    };
  }

  if (!parsedUnknown || typeof parsedUnknown !== 'object') {
    return { ok: false, message: 'Backup JSON must be an object.' };
  }

  const envelope = parsedUnknown as Record<string, any>;
  const source =
    envelope.settings && typeof envelope.settings === 'object'
      ? (envelope.settings as Record<string, any>)
      : envelope;

  const hasKnownKey =
    'plugins' in source ||
    'favoritePlugins' in source ||
    'activeThemeId' in source ||
    'customThemes' in source ||
    'updateSource' in source;
  if (!hasKnownKey) {
    return { ok: false, message: 'JSON does not contain valid Nekocord settings fields.' };
  }

  const nextPlugins: Record<string, { enabled: boolean }> = {};
  const changedSet = new Set<string>();
  const oldPlugins = state.plugins;

  if (source.plugins && typeof source.plugins === 'object') {
    for (const [name, val] of Object.entries(source.plugins)) {
      if (val && typeof val === 'object' && typeof (val as any).enabled === 'boolean') {
        const enabled = (val as any).enabled;
        nextPlugins[name] = { enabled };
        if (oldPlugins[name]?.enabled !== enabled) {
          changedSet.add(name);
        }
      }
    }
  }
  for (const oldName of Object.keys(oldPlugins)) {
    if (!(oldName in nextPlugins)) {
      changedSet.add(oldName);
    }
  }

  const nextFavorites = Array.isArray(source.favoritePlugins)
    ? Array.from(
        new Set(
          source.favoritePlugins.filter(
            (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0,
          ),
        ),
      )
    : [];

  const nextThemeId =
    source.activeThemeId === null || typeof source.activeThemeId === 'string'
      ? source.activeThemeId
      : null;

  const nextCustomThemes = Array.isArray(source.customThemes)
    ? source.customThemes.filter(
        (item: unknown): item is StoredNekocordTheme =>
          Boolean(
            item &&
              typeof item === 'object' &&
              typeof (item as any).id === 'string' &&
              typeof (item as any).name === 'string',
          ),
      )
    : [];

  const nextUpdateSource =
    typeof source.updateSource === 'string' && source.updateSource.trim()
      ? source.updateSource.trim()
      : DEFAULT_UPDATE_SOURCE;

  for (const k of Object.keys(state.plugins)) {
    dirtyPlugins.add(k);
  }
  for (const k of Object.keys(nextPlugins)) {
    dirtyPlugins.add(k);
  }
  state.plugins = nextPlugins;
  state.favoritePlugins = nextFavorites;
  state.activeThemeId = nextThemeId;
  state.customThemes = nextCustomThemes;
  state.updateSource = nextUpdateSource;
  dirtyFavorites = true;
  dirtyActiveTheme = true;
  dirtyCustomThemes = true;
  dirtyUpdateSource = true;

  persist();
  notifyListeners();

  const pluginCount = Object.keys(nextPlugins).length;
  return {
    ok: true,
    message: `Imported settings (${pluginCount} plugin overrides, ${nextFavorites.length} favorites).`,
    pluginCount,
    changedPlugins: Array.from(changedSet),
  };
}

/**
 * Resets all plugin overrides, favorites, themes, and update source back to defaults.
 */
export function resetSettings(): void {
  for (const k of Object.keys(state.plugins)) {
    dirtyPlugins.add(k);
  }
  state.plugins = {};
  state.favoritePlugins = [];
  state.activeThemeId = null;
  state.customThemes = [];
  state.updateSource = DEFAULT_UPDATE_SOURCE;
  dirtyFavorites = true;
  dirtyActiveTheme = true;
  dirtyCustomThemes = true;
  dirtyUpdateSource = true;
  persist();
  notifyListeners();
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
