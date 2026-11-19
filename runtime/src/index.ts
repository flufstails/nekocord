import * as common from './metro/common.js';
import * as metro from './metro/index.js';
import * as notifications from './notifications/index.js';
import * as patcher from './patcher/index.js';
import {
  buildStoredCustomPluginFromCode,
  compileCustomPlugin,
  fetchCustomPluginFromUrl,
} from './plugins/custom.js';
import { getMessageLoggerStats } from './plugins/messageLogger/index.js';
import { openNekocordSettings } from './plugins/nekocordSettingsUI/index.js';
import { builtinPlugins } from './plugins/registry.generated.js';
import type { NekocordPlugin } from './plugins/types.js';
import * as storage from './storage/index.js';
import * as themes from './themes/index.js';
import * as updater from './updater/index.js';

import type { NekocordTab } from './ui/NekocordModal.js';

export const NEKOCORD_VERSION = '1.4.0';
export const NEKOCORD_TAGLINE = 'Your cutest Discord client on mobile';

export interface NekocordApi {
  version: string;
  tagline: string;
  metro: typeof metro;
  common: typeof common;
  patcher: typeof patcher;
  notifications: typeof notifications;
  storage: typeof storage;
  themes: typeof themes;
  updater: typeof updater;
  plugins: Map<string, NekocordPlugin>;
  messageLoggerStats: typeof getMessageLoggerStats;
  getActivePlugins(): ReadonlySet<string>;
  startPlugin(name: string): boolean;
  stopPlugin(name: string): boolean;
  togglePlugin(name: string): boolean;
  importPluginFromCode(
    code: string,
    name?: string,
  ): { ok: boolean; plugin?: NekocordPlugin; message: string };
  importPluginFromUrl(
    url: string,
  ): Promise<{ ok: boolean; plugin?: NekocordPlugin; message: string }>;
  uninstallCustomPlugin(name: string): boolean;
  subscribePlugins(listener: () => void): () => void;
  reconcileSettings(): void;
  openSettings(tab?: NekocordTab): void;
  status(): ReturnType<typeof metro.getMetroStats> & { activePlugins: string[] };
}

export type PurrcordApi = NekocordApi;

declare global {
  // eslint-disable-next-line no-var
  var Nekocord: NekocordApi | undefined;
  // eslint-disable-next-line no-var
  var Purrcord: NekocordApi | undefined;
}

const pluginRegistry = new Map<string, NekocordPlugin>();
const activePlugins = new Set<string>();
const corePluginNames = new Set(builtinPlugins.filter((p) => p.core).map((p) => p.name));
const pluginRegistryListeners = new Set<() => void>();
let activeSnapshot: ReadonlySet<string> = new Set<string>();

function notifyPluginRegistryListeners(): void {
  for (const listener of Array.from(pluginRegistryListeners)) {
    try {
      listener();
    } catch {
      // Ignore subscriber errors.
    }
  }
}

function refreshActiveSnapshot(): void {
  activeSnapshot = new Set(activePlugins);
}

function startPlugin(name: string, visiting?: Set<string>): boolean {
  const plugin = pluginRegistry.get(name);
  if (!plugin || activePlugins.has(name)) {
    return false;
  }
  const seen = visiting ?? new Set<string>();
  if (seen.has(name)) {
    return false;
  }
  seen.add(name);
  if (Array.isArray(plugin.dependencies)) {
    for (let i = 0; i < plugin.dependencies.length; i += 1) {
      const depName = plugin.dependencies[i];
      if (!activePlugins.has(depName)) {
        startPlugin(depName, seen);
        storage.setPluginEnabled(depName, true);
      }
    }
  }
  try {
    plugin.start?.();
    activePlugins.add(name);
    refreshActiveSnapshot();
    return true;
  } catch (err) {
    console.error(`[Nekocord] Failed to start plugin "${name}":`, err);
    return false;
  }
}

function stopPlugin(name: string): boolean {
  const plugin = pluginRegistry.get(name);
  if (!plugin || plugin.core || !activePlugins.has(name)) {
    return false;
  }
  try {
    plugin.stop?.();
  } catch (err) {
    console.error(`[Nekocord] Failed to stop plugin "${name}":`, err);
  }
  activePlugins.delete(name);
  refreshActiveSnapshot();
  return true;
}

function togglePlugin(name: string): boolean {
  const plugin = pluginRegistry.get(name);
  if (!plugin || plugin.core) {
    return false;
  }
  const nextEnabled = !activePlugins.has(name);
  if (nextEnabled) {
    startPlugin(name);
  } else {
    stopPlugin(name);
  }
  storage.setPluginEnabled(name, nextEnabled);
  return nextEnabled;
}

function registerAndStartImportedPlugin(
  stored: storage.StoredCustomPlugin,
  plugin: NekocordPlugin,
): { ok: boolean; plugin: NekocordPlugin; message: string } {
  const existing = pluginRegistry.get(plugin.name);
  if (existing && activePlugins.has(plugin.name)) {
    stopPlugin(plugin.name);
  }
  storage.addCustomPlugin(stored);
  pluginRegistry.set(plugin.name, plugin);
  storage.setPluginEnabled(plugin.name, true);
  startPlugin(plugin.name);
  notifyPluginRegistryListeners();
  notifications.pushNotification({
    title: 'Custom Plugin Imported',
    body: `Installed and enabled ${plugin.name}.`,
    source: 'Plugins',
    kind: 'success',
  });
  return { ok: true, plugin, message: `Installed "${plugin.name}".` };
}

function importPluginFromCode(
  code: string,
  name?: string,
): { ok: boolean; plugin?: NekocordPlugin; message: string } {
  const res = buildStoredCustomPluginFromCode(code, { name, blockedCoreNames: corePluginNames });
  if (!res.ok || !res.stored || !res.plugin) {
    return { ok: false, message: res.error ?? 'Failed to import plugin.' };
  }
  return registerAndStartImportedPlugin(res.stored, res.plugin);
}

async function importPluginFromUrl(
  url: string,
): Promise<{ ok: boolean; plugin?: NekocordPlugin; message: string }> {
  const res = await fetchCustomPluginFromUrl(url, corePluginNames);
  if (!res.ok || !res.stored || !res.plugin) {
    return { ok: false, message: res.error ?? 'Failed to fetch plugin URL.' };
  }
  return registerAndStartImportedPlugin(res.stored, res.plugin);
}

function uninstallCustomPlugin(name: string): boolean {
  const existing = pluginRegistry.get(name);
  if (!existing?.imported) {
    return false;
  }
  if (activePlugins.has(name)) {
    stopPlugin(name);
  }
  pluginRegistry.delete(name);
  storage.removeCustomPlugin(name);
  notifyPluginRegistryListeners();
  notifications.pushNotification({
    title: 'Custom Plugin Removed',
    body: `Uninstalled ${name}.`,
    source: 'Plugins',
    kind: 'info',
  });
  return true;
}

function syncCustomPluginsFromStorage(): boolean {
  let listChanged = false;
  const saved = storage.getCustomPlugins();
  const savedNames = new Set<string>();

  for (let i = 0; i < saved.length; i += 1) {
    const item = saved[i];
    if (corePluginNames.has(item.name)) continue;
    savedNames.add(item.name);
    if (!pluginRegistry.has(item.name)) {
      const compiled = compileCustomPlugin(item);
      if (compiled.ok && compiled.plugin) {
        pluginRegistry.set(compiled.plugin.name, compiled.plugin);
        listChanged = true;
      }
    }
  }

  for (const [name, pl] of Array.from(pluginRegistry.entries())) {
    if (pl.imported && !savedNames.has(name)) {
      if (activePlugins.has(name)) {
        stopPlugin(name);
      }
      pluginRegistry.delete(name);
      listChanged = true;
    }
  }

  return listChanged;
}

function reconcilePluginsWithStorage(): void {
  const listChanged = syncCustomPluginsFromStorage();
  let changed = false;
  for (const plugin of pluginRegistry.values()) {
    if (plugin.core) {
      continue;
    }
    const desired = storage.isPluginEnabled(plugin.name, plugin.enabledByDefault !== false);
    const active = activePlugins.has(plugin.name);
    if (desired && !active) {
      try {
        plugin.start?.();
        activePlugins.add(plugin.name);
        changed = true;
      } catch (err) {
        console.error(`[Nekocord] Failed to start plugin "${plugin.name}":`, err);
      }
    } else if (!desired && active) {
      try {
        plugin.stop?.();
      } catch (err) {
        console.error(`[Nekocord] Failed to stop plugin "${plugin.name}":`, err);
      }
      activePlugins.delete(plugin.name);
      changed = true;
    }
  }
  if (changed) {
    refreshActiveSnapshot();
  }
  if (listChanged) {
    notifyPluginRegistryListeners();
  }
  console.log(`[Nekocord] Active plugins (${activePlugins.size}): [${Array.from(activePlugins).join(', ')}]`);
}

function bootstrap(): void {
  if (globalThis.Nekocord) {
    return;
  }

  for (const plugin of builtinPlugins) {
    pluginRegistry.set(plugin.name, plugin);
  }

  const api: NekocordApi = {
    version: NEKOCORD_VERSION,
    tagline: NEKOCORD_TAGLINE,
    metro,
    common,
    patcher,
    notifications,
    storage,
    themes,
    updater,
    plugins: pluginRegistry,
    messageLoggerStats: getMessageLoggerStats,
    getActivePlugins() {
      return activeSnapshot;
    },
    startPlugin,
    stopPlugin,
    togglePlugin,
    importPluginFromCode,
    importPluginFromUrl,
    uninstallCustomPlugin,
    subscribePlugins(listener: () => void) {
      pluginRegistryListeners.add(listener);
      return () => {
        pluginRegistryListeners.delete(listener);
      };
    },
    reconcileSettings() {
      reconcilePluginsWithStorage();
      themes.applyActiveTheme();
    },
    openSettings: openNekocordSettings,
    status() {
      return {
        ...metro.getMetroStats(),
        activePlugins: Array.from(activePlugins),
      };
    },
  };

  globalThis.Nekocord = api;
  globalThis.Purrcord = api;
  themes.initThemeEngine();
  notifications.initNotificationLog();

  for (const plugin of builtinPlugins) {
    if (plugin.core || plugin.enabledByDefault !== false) {
      try {
        plugin.start?.();
        activePlugins.add(plugin.name);
      } catch (err) {
        console.error(`[Nekocord] Failed to start plugin "${plugin.name}":`, err);
      }
    }
  }
  refreshActiveSnapshot();

  storage.hydrateSettings(() => {
    reconcilePluginsWithStorage();
    themes.applyActiveTheme();
  });
}

bootstrap();
