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
  kind?: 'json' | 'css';
  customCss?: string;
  sourceUrl?: string;
  baseMode?: 'dark' | 'light';
  preview?: string[];
  semanticColors?: Record<string, Array<string | null> | string>;
  rawColors?: Record<string, string>;
}

export type StoredPurrcordTheme = StoredNekocordTheme;

export interface StoredCustomPlugin {
  id: string;
  slug: string;
  name: string;
  description: string;
  authors: Array<{ name: string; icon?: string; github?: string }>;
  authorIcon?: string;
  category: string;
  sourceUrl?: string;
  code: string;
  tags?: string[];
  readme?: string;
  installedAt: number;
}

export interface NotificationLogSettings {
  enabled: boolean;
  showToasts: boolean;
  captureMentions: boolean;
  captureRelationships: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationLogSettings = {
  enabled: true,
  showToasts: true,
  captureMentions: true,
  captureRelationships: true,
};

export interface NekocordSettings {
  plugins: Record<string, { enabled: boolean }>;
  pluginSettings?: Record<string, Record<string, any>>;
  favoritePlugins?: string[];
  activeThemeId?: string | null;
  customThemes?: StoredNekocordTheme[];
  customPlugins?: StoredCustomPlugin[];
  notificationSettings?: NotificationLogSettings;
  updateSource?: string;
}

export type PurrcordSettings = NekocordSettings;

const state: NekocordSettings = {
  plugins: {},
  pluginSettings: {},
  favoritePlugins: [],
  activeThemeId: null,
  customThemes: [],
  customPlugins: [],
  notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS },
  updateSource: DEFAULT_UPDATE_SOURCE,
};

const dirtyPlugins = new Set<string>();
const dirtyPluginSettings = new Set<string>();
let dirtyFavorites = false;
let dirtyActiveTheme = false;
let dirtyCustomThemes = false;
let dirtyCustomPlugins = false;
let dirtyNotificationSettings = false;
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
  if (parsed.pluginSettings && typeof parsed.pluginSettings === 'object') {
    state.pluginSettings ??= {};
    for (const [rawName, cfg] of Object.entries(parsed.pluginSettings)) {
      const name = fromLegacy ? (LEGACY_PLUGIN_KEY_REMAP[rawName] ?? rawName) : rawName;
      if (!dirtyPluginSettings.has(name) && cfg && typeof cfg === 'object' && !Array.isArray(cfg)) {
        state.pluginSettings[name] = { ...cfg };
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
  if (!dirtyCustomPlugins && Array.isArray(parsed.customPlugins)) {
    state.customPlugins = parsed.customPlugins.filter(
      (item): item is StoredCustomPlugin =>
        Boolean(
          item &&
            typeof item === 'object' &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.code === 'string',
        ),
    );
  }
  if (!dirtyNotificationSettings && parsed.notificationSettings && typeof parsed.notificationSettings === 'object') {
    const ns = parsed.notificationSettings as Partial<NotificationLogSettings>;
    state.notificationSettings = {
      enabled: ns.enabled !== false,
      showToasts: ns.showToasts !== false,
      captureMentions: ns.captureMentions !== false,
      captureRelationships: ns.captureRelationships !== false,
    };
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
          try {
            console.log('[Nekocord/Storage] Hydrated settings from nekocord:settings:v1');
            const parsed = JSON.parse(raw) as Partial<NekocordSettings> | null;
            applyParsedSettings(parsed, false);
            notifyListeners();
            onHydrated?.(state);
            return;
          } catch (err) {
            console.error('[Nekocord/Storage] Corrupt settings JSON; keeping active defaults:', err);
          }
        }

        const legacyRaw = await cache.getItem(LEGACY_STORAGE_KEY).catch(() => null);
        if (legacyRaw) {
          try {
            console.log('[Nekocord/Storage] Migrating legacy settings from purrcord:settings:v1');
            const legacyParsed = JSON.parse(legacyRaw) as Partial<NekocordSettings> | null;
            applyParsedSettings(legacyParsed, true);
            persist();
            notifyListeners();
            onHydrated?.(state);
            return;
          } catch (err) {
            console.error('[Nekocord/Storage] Corrupt legacy settings JSON; using defaults:', err);
          }
        }

        console.log('[Nekocord/Storage] Initialized fresh settings');
        onHydrated?.(state);
      })
      .catch((err) => {
        console.error('[Nekocord/Storage] Failed to load settings:', err);
        onHydrated?.(state);
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

export function getCustomPlugins(): StoredCustomPlugin[] {
  return state.customPlugins ? [...state.customPlugins] : [];
}

export function addCustomPlugin(plugin: StoredCustomPlugin): void {
  dirtyCustomPlugins = true;
  const current = state.customPlugins ?? [];
  const idx = current.findIndex((item) => item.name === plugin.name || item.id === plugin.id);
  if (idx >= 0) {
    current[idx] = plugin;
  } else {
    current.push(plugin);
  }
  state.customPlugins = current;
  persist();
  notifyListeners();
}

export function removeCustomPlugin(nameOrId: string): void {
  dirtyCustomPlugins = true;
  const current = state.customPlugins ?? [];
  const removedNames = new Set<string>();
  const kept: StoredCustomPlugin[] = [];
  for (let i = 0; i < current.length; i += 1) {
    const item = current[i];
    if (item.name === nameOrId || item.id === nameOrId) {
      removedNames.add(item.name);
    } else {
      kept.push(item);
    }
  }
  removedNames.add(nameOrId);
  state.customPlugins = kept;

  removedNames.forEach((removedName) => {
    if (removedName in state.plugins) {
      dirtyPlugins.add(removedName);
      delete state.plugins[removedName];
    }
    if (state.pluginSettings && removedName in state.pluginSettings) {
      dirtyPluginSettings.add(removedName);
      delete state.pluginSettings[removedName];
    }
  });
  if (Array.isArray(state.favoritePlugins)) {
    const nextFavs = state.favoritePlugins.filter((fav) => !removedNames.has(fav));
    if (nextFavs.length !== state.favoritePlugins.length) {
      dirtyFavorites = true;
      state.favoritePlugins = nextFavs;
    }
  }

  persist();
  notifyListeners();
}

export function getNotificationSettings(): NotificationLogSettings {
  const ns = state.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS;
  return {
    enabled: ns.enabled !== false,
    showToasts: ns.showToasts !== false,
    captureMentions: ns.captureMentions !== false,
    captureRelationships: ns.captureRelationships !== false,
  };
}

export function updateNotificationSettings(patch: Partial<NotificationLogSettings>): NotificationLogSettings {
  dirtyNotificationSettings = true;
  const current = getNotificationSettings();
  const next: NotificationLogSettings = {
    enabled: patch.enabled !== undefined ? Boolean(patch.enabled) : current.enabled,
    showToasts: patch.showToasts !== undefined ? Boolean(patch.showToasts) : current.showToasts,
    captureMentions:
      patch.captureMentions !== undefined ? Boolean(patch.captureMentions) : current.captureMentions,
    captureRelationships:
      patch.captureRelationships !== undefined
        ? Boolean(patch.captureRelationships)
        : current.captureRelationships,
  };
  state.notificationSettings = next;
  persist();
  notifyListeners();
  return next;
}

export function getUpdateSource(): string {
  return state.updateSource?.trim() ? state.updateSource : DEFAULT_UPDATE_SOURCE;
}

export function getPluginSettingValue<T>(pluginName: string, key: string, fallback: T): T {
  const bucket = state.pluginSettings?.[pluginName];
  if (!bucket || !(key in bucket)) {
    return fallback;
  }
  return bucket[key] as T;
}

export function setPluginSettingValue(pluginName: string, key: string, value: any): void {
  dirtyPluginSettings.add(pluginName);
  state.pluginSettings ??= {};
  state.pluginSettings[pluginName] ??= {};
  state.pluginSettings[pluginName][key] = value;
  persist();
  notifyListeners();
}

export function resetPluginSettings(pluginName: string): void {
  dirtyPluginSettings.add(pluginName);
  if (state.pluginSettings && pluginName in state.pluginSettings) {
    delete state.pluginSettings[pluginName];
  }
  persist();
  notifyListeners();
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
  if (partial.pluginSettings) {
    state.pluginSettings ??= {};
    for (const [name, cfg] of Object.entries(partial.pluginSettings)) {
      if (cfg && typeof cfg === 'object' && !Array.isArray(cfg)) {
        dirtyPluginSettings.add(name);
        state.pluginSettings[name] = { ...cfg };
      }
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
  if (partial.customPlugins !== undefined) {
    dirtyCustomPlugins = true;
    state.customPlugins = [...partial.customPlugins];
  }
  if (partial.notificationSettings !== undefined) {
    dirtyNotificationSettings = true;
    const ns = partial.notificationSettings;
    state.notificationSettings = {
      enabled: ns.enabled !== false,
      showToasts: ns.showToasts !== false,
      captureMentions: ns.captureMentions !== false,
      captureRelationships: ns.captureRelationships !== false,
    };
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
      nekocordVersion: globalThis.Nekocord?.version ?? '1.6.0',
      exportedAt: new Date().toISOString(),
      settings: {
        plugins: state.plugins,
        pluginSettings: state.pluginSettings ?? {},
        favoritePlugins: state.favoritePlugins ?? [],
        activeThemeId: state.activeThemeId ?? null,
        customThemes: state.customThemes ?? [],
        customPlugins: state.customPlugins ?? [],
        notificationSettings: getNotificationSettings(),
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
    'pluginSettings' in source ||
    'favoritePlugins' in source ||
    'activeThemeId' in source ||
    'customThemes' in source ||
    'customPlugins' in source ||
    'notificationSettings' in source ||
    'updateSource' in source;
  if (!hasKnownKey) {
    return { ok: false, message: 'JSON does not contain valid Nekocord settings fields.' };
  }

  const nextPlugins: Record<string, { enabled: boolean }> = {};
  const nextPluginSettings: Record<string, Record<string, any>> = {};
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
  if (source.pluginSettings && typeof source.pluginSettings === 'object' && !Array.isArray(source.pluginSettings)) {
    for (const [name, val] of Object.entries(source.pluginSettings)) {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        nextPluginSettings[name] = { ...(val as Record<string, any>) };
        dirtyPluginSettings.add(name);
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

  const nextCustomPlugins = Array.isArray(source.customPlugins)
    ? source.customPlugins.filter(
        (item: unknown): item is StoredCustomPlugin =>
          Boolean(
            item &&
              typeof item === 'object' &&
              typeof (item as any).id === 'string' &&
              typeof (item as any).name === 'string' &&
              typeof (item as any).code === 'string',
          ),
      )
    : [];

  const rawNotif =
    source.notificationSettings && typeof source.notificationSettings === 'object'
      ? (source.notificationSettings as Partial<NotificationLogSettings>)
      : null;
  const nextNotificationSettings: NotificationLogSettings = rawNotif
    ? {
        enabled: rawNotif.enabled !== false,
        showToasts: rawNotif.showToasts !== false,
        captureMentions: rawNotif.captureMentions !== false,
        captureRelationships: rawNotif.captureRelationships !== false,
      }
    : { ...DEFAULT_NOTIFICATION_SETTINGS };

  const nextUpdateSource =
    typeof source.updateSource === 'string' && source.updateSource.trim()
      ? source.updateSource.trim()
      : DEFAULT_UPDATE_SOURCE;

  for (const oldName of Object.keys(state.pluginSettings ?? {})) {
    dirtyPluginSettings.add(oldName);
  }
  for (const k of Object.keys(state.plugins)) {
    dirtyPlugins.add(k);
  }
  for (const k of Object.keys(nextPlugins)) {
    dirtyPlugins.add(k);
  }
  state.plugins = nextPlugins;
  state.pluginSettings = nextPluginSettings;
  state.favoritePlugins = nextFavorites;
  state.activeThemeId = nextThemeId;
  state.customThemes = nextCustomThemes;
  state.customPlugins = nextCustomPlugins;
  state.notificationSettings = nextNotificationSettings;
  state.updateSource = nextUpdateSource;
  dirtyFavorites = true;
  dirtyActiveTheme = true;
  dirtyCustomThemes = true;
  dirtyCustomPlugins = true;
  dirtyNotificationSettings = true;
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
 * Resets all plugin overrides, per-plugin settings, favorites, themes, custom plugins, notifications, and update source back to defaults.
 */
export function resetSettings(): void {
  for (const k of Object.keys(state.plugins)) {
    dirtyPlugins.add(k);
  }
  for (const k of Object.keys(state.pluginSettings ?? {})) {
    dirtyPluginSettings.add(k);
  }
  state.plugins = {};
  state.pluginSettings = {};
  state.favoritePlugins = [];
  state.activeThemeId = null;
  state.customThemes = [];
  state.customPlugins = [];
  state.notificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };
  state.updateSource = DEFAULT_UPDATE_SOURCE;
  dirtyFavorites = true;
  dirtyActiveTheme = true;
  dirtyCustomThemes = true;
  dirtyCustomPlugins = true;
  dirtyNotificationSettings = true;
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
