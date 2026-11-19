import * as common from './metro/common.js';
import * as metro from './metro/index.js';
import * as patcher from './patcher/index.js';
import { getMessageLoggerStats } from './plugins/messageLogger/index.js';
import { openNekocordSettings } from './plugins/nekocordSettingsUI/index.js';
import { builtinPlugins } from './plugins/registry.generated.js';
import type { NekocordPlugin } from './plugins/types.js';
import * as storage from './storage/index.js';
import * as themes from './themes/index.js';
import * as updater from './updater/index.js';

export const NEKOCORD_VERSION = '1.0.0';
export const NEKOCORD_TAGLINE = 'Your cutest Discord client on mobile';

export interface NekocordApi {
  version: string;
  tagline: string;
  metro: typeof metro;
  common: typeof common;
  patcher: typeof patcher;
  storage: typeof storage;
  themes: typeof themes;
  updater: typeof updater;
  plugins: Map<string, NekocordPlugin>;
  messageLoggerStats: typeof getMessageLoggerStats;
  getActivePlugins(): ReadonlySet<string>;
  startPlugin(name: string): boolean;
  stopPlugin(name: string): boolean;
  togglePlugin(name: string): boolean;
  openSettings(tab?: 'overview' | 'plugins' | 'themes'): void;
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
let activeSnapshot: ReadonlySet<string> = new Set<string>();

function refreshActiveSnapshot(): void {
  activeSnapshot = new Set(activePlugins);
}

function startPlugin(name: string): boolean {
  const plugin = pluginRegistry.get(name);
  if (!plugin || activePlugins.has(name)) {
    return false;
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

function reconcilePluginsWithStorage(): void {
  let changed = false;
  for (const plugin of builtinPlugins) {
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
