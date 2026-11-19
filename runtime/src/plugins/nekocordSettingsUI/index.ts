import { getReact, getThemeStore, onReactAndNative } from '../../metro/common.js';
import { findByProps, waitFor } from '../../metro/index.js';
import { after, instead, type Unpatch } from '../../patcher/index.js';
import { createNekocordOverlay, openNekocordSettings, type NekocordTab } from '../../ui/NekocordModal.js';
import { createSettingRowIcon } from '../../ui/VencordIcons.js';
import { definePlugin } from '../types.js';

interface NekocordSettingEntry {
  key: string;
  title: string;
  tab: NekocordTab;
  breadcrumbs: string[];
  searchTerms: string[];
  createIcon: () => any;
}

const NEKOCORD_KEYS = new Set([
  'NEKOCORD_SETTINGS',
  'NEKOCORD_PLUGINS',
  'NEKOCORD_THEMES',
  'NEKOCORD_UPDATER',
  'NEKOCORD_BACKUP',
]);

let cancelReactWait: (() => void) | null = null;
const cleanups: Array<() => void> = [];
let loggedRootRender = false;

function getPreloadState() {
  return globalThis.__NEKOCORD_PRELOAD__ ?? globalThis.__PURRCORD_PRELOAD__ ?? null;
}

function wrapRootComponent(React: any, Overlay: any, OriginalComponent: any) {
  return function NekocordRootWrapper(props: any) {
    if (!loggedRootRender) {
      loggedRootRender = true;
      console.log('[Nekocord/SettingsUI] NekocordRootWrapper rendered');
    }
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(OriginalComponent, props),
      React.createElement(Overlay, null),
    );
  };
}

function getFallbackTint(): string {
  const theme = getThemeStore<{ theme?: string }>()?.theme;
  return theme === 'light' ? '#4e5058' : '#f2f3f5';
}

function createSettingData(entry: NekocordSettingEntry, IconComponent: any): Record<string, any> {
  const useTitle = () => entry.title;
  const onPress = () => openNekocordSettings(entry.tab);
  return {
    type: 'pressable',
    useTitle,
    IconComponent,
    onPress,
    withArrow: true,
  };
}

function resolveComponentTarget(mod: any, prop: string): { target: any; key: string } | null {
  const val = mod?.[prop];
  if (typeof val === 'function') {
    return { target: mod, key: prop };
  }
  if (val && typeof val === 'object') {
    if (typeof val.type === 'function') {
      return { target: val, key: 'type' };
    }
    if (typeof val.render === 'function') {
      return { target: val, key: 'render' };
    }
  }
  return null;
}

function readSearchInputQueryFromTree(root: unknown): string | null {
  const queue: Array<{ node: unknown; depth: number }> = [{ node: root, depth: 0 }];
  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;
    if (!node || typeof node !== 'object' || depth > 4) {
      continue;
    }
    const el = node as { props?: Record<string, unknown> };
    const props = el.props;
    if (!props || typeof props !== 'object') {
      continue;
    }
    if (props.testID === 'user_settings_search_input') {
      if (typeof props.value === 'string') {
        return props.value;
      }
      if (typeof props.defaultValue === 'string') {
        return props.defaultValue;
      }
      return '';
    }
    const children = props.children;
    if (Array.isArray(children)) {
      for (let i = 0; i < children.length; i += 1) {
        queue.push({ node: children[i], depth: depth + 1 });
      }
    } else if (children) {
      queue.push({ node: children, depth: depth + 1 });
    }
  }
  return null;
}

function matchesEntryQuery(entry: NekocordSettingEntry, rawQuery: unknown): boolean {
  if (typeof rawQuery !== 'string') {
    return false;
  }
  const query = rawQuery.trim().toLowerCase();
  if (!query) {
    return false;
  }
  for (let i = 0; i < entry.searchTerms.length; i += 1) {
    if (entry.searchTerms[i].includes(query)) {
      return true;
    }
  }
  if (entry.key === 'NEKOCORD_PLUGINS') {
    const plugins = globalThis.Nekocord?.plugins;
    if (plugins) {
      let found = false;
      plugins.forEach((plugin) => {
        if (found || plugin.core) return;
        if (
          plugin.name.toLowerCase().includes(query) ||
          plugin.category.toLowerCase().includes(query) ||
          plugin.tags?.some((tag) => tag.toLowerCase().includes(query))
        ) {
          found = true;
        }
      });
      if (found) return true;
    }
  }
  return false;
}

function buildSettingEntries(): NekocordSettingEntry[] {
  return [
    {
      key: 'NEKOCORD_SETTINGS',
      title: 'Nekocord',
      tab: 'overview',
      breadcrumbs: ['Nekocord'],
      searchTerms: ['nekocord', 'nekocord settings', 'about', 'quick actions'],
      createIcon: () => createSettingRowIcon('mainSettings', getFallbackTint),
    },
    {
      key: 'NEKOCORD_PLUGINS',
      title: 'Plugins',
      tab: 'plugins',
      breadcrumbs: ['Nekocord', 'Plugins'],
      searchTerms: [
        'nekocord',
        'plugins',
        'notrack',
        'developer mode',
        'message logger',
        'fakenitro',
        'fake nitro',
        'silenttyping',
        'silentmessages',
        'noreplymention',
        'clearurls',
        'fixembeds',
        'experiments',
        'showhiddenchannels',
        'nekocord settings',
      ],
      createIcon: () => createSettingRowIcon('plugins', getFallbackTint),
    },
    {
      key: 'NEKOCORD_THEMES',
      title: 'Themes',
      tab: 'themes',
      breadcrumbs: ['Nekocord', 'Themes'],
      searchTerms: [
        'nekocord',
        'themes',
        'theme',
        'appearance',
        'colors',
        'amoled',
        'catppuccin',
        'rose pine',
        'nordic',
        'sakura',
        'tokyo night',
      ],
      createIcon: () => createSettingRowIcon('paintbrush', getFallbackTint),
    },
    {
      key: 'NEKOCORD_UPDATER',
      title: 'Updater',
      tab: 'updater',
      breadcrumbs: ['Nekocord', 'Updater'],
      searchTerms: ['nekocord', 'updater', 'update', 'updates', 'ota', 'release', 'github'],
      createIcon: () => createSettingRowIcon('updater', getFallbackTint),
    },
    {
      key: 'NEKOCORD_BACKUP',
      title: 'Backup & Restore',
      tab: 'backup',
      breadcrumbs: ['Nekocord', 'Backup & Restore'],
      searchTerms: ['nekocord', 'backup', 'restore', 'export', 'import', 'json', 'sync', 'reset'],
      createIcon: () => createSettingRowIcon('backupRestore', getFallbackTint),
    },
  ];
}

function injectIntoUserSettingsList(listUtils: any, source: string): void {
  const listKeys = Object.keys(listUtils).slice(0, 8).join(',');
  console.log(`[Nekocord/SettingsUI] Hooked UserSettingsListUtils (source=${source}, keys=[${listKeys}])`);

  const entries = buildSettingEntries();
  const entryMap = new Map(
    entries.map((entry) => {
      const IconComponent = entry.createIcon();
      const settingData = createSettingData(entry, IconComponent);
      return [entry.key, { entry, IconComponent, settingData }] as const;
    }),
  );

  const staticHeader = {
    type: 'section_header',
    label: 'Nekocord',
  };
  const staticSectionRows = entries.map((entry, idx) => {
    const cached = entryMap.get(entry.key)!;
    return {
      type: 'section_row',
      setting: entry.key,
      settingData: cached.settingData,
      start: idx === 0,
      end: idx === entries.length - 1,
    };
  });

  let loggedInjection = false;
  let loggedLayoutMiss = false;
  let searchItemType = 'setting_search_result';
  let lastScoredWasLoading = false;
  let searchListHooked = false;
  let latestSettingsQuery = '';
  const wrappedHeaders = new WeakMap<(...a: any[]) => any, (...a: any[]) => any>();

  const buildMatchingSearchItems = (existingItems: any[], query: unknown): any[] => {
    const matches = entries.filter(
      (entry) =>
        matchesEntryQuery(entry, query) &&
        !existingItems.some((item) => item?.setting === entry.key),
    );
    if (matches.length === 0) {
      return existingItems;
    }
    const offset = matches.length;
    const total = existingItems.length + offset;
    const synthesized = matches.map((entry, idx) => {
      const cached = entryMap.get(entry.key)!;
      return {
        type: searchItemType,
        setting: entry.key,
        settingData: cached.settingData,
        title: entry.title,
        IconComponent: cached.IconComponent,
        breadcrumbs: entry.breadcrumbs,
        index: idx,
        total,
      };
    });
    const shifted = existingItems.map((item, idx) =>
      typeof item === 'object' && item !== null && 'index' in item
        ? { ...item, index: idx + offset, total }
        : item,
    );
    return [...synthesized, ...shifted];
  };

  const wrapHeaderRenderer = (origHeader: (...a: any[]) => any) => {
    const existing = wrappedHeaders.get(origHeader);
    if (existing) {
      return existing;
    }
    const wrapper = function NekocordSettingsHeaderWrapper(this: unknown, ...hArgs: any[]) {
      const rendered = origHeader.apply(this, hArgs);
      const extracted = readSearchInputQueryFromTree(rendered);
      if (extracted !== null) {
        latestSettingsQuery = extracted;
      }
      return rendered;
    };
    wrappedHeaders.set(origHeader, wrapper);
    return wrapper;
  };

  const hookSearchListModule = (mod: any): boolean => {
    if (searchListHooked) {
      return true;
    }
    const resolved = resolveComponentTarget(mod, 'SearchableSettingsList');
    if (!resolved) {
      return false;
    }
    try {
      const uList: Unpatch = instead(
        resolved.target,
        resolved.key,
        (args: any[], orig: (...a: any[]) => any) => {
          const resultEl = orig(...args);
          const outProps = resultEl?.props;
          const React = getReact();
          if (!resultEl || !outProps || !React?.cloneElement) {
            return resultEl;
          }

          const clonePatch: Record<string, any> = {};
          let shouldClone = false;

          if (typeof outProps.ListHeaderComponent === 'function') {
            clonePatch.ListHeaderComponent = wrapHeaderRenderer(outProps.ListHeaderComponent);
            shouldClone = true;
          }

          if (Array.isArray(outProps.data) && !lastScoredWasLoading && latestSettingsQuery.trim()) {
            const nextData = buildMatchingSearchItems(outProps.data, latestSettingsQuery);
            if (nextData !== outProps.data) {
              clonePatch.data = nextData;
              shouldClone = true;
            }
          }

          return shouldClone ? React.cloneElement(resultEl, clonePatch) : resultEl;
        },
      );
      cleanups.push(uList);
      searchListHooked = true;
      return true;
    } catch {
      return false;
    }
  };

  const ensureSearchListHooked = () => {
    if (!searchListHooked) {
      const mod = findByProps('SearchableSettingsList');
      if (mod) {
        hookSearchListModule(mod);
      }
    }
  };

  if (typeof listUtils.toSettingListItems === 'function') {
    try {
      const u: Unpatch = after(listUtils, 'toSettingListItems', (args: any[], res: any) => {
        const layout = args[0];
        if (
          layout?.type === 'list' &&
          Array.isArray(layout?.sections) &&
          !layout.sections.some((s: any) => s?.label === 'Account Settings')
        ) {
          if (!loggedInjection && !loggedLayoutMiss) {
            loggedLayoutMiss = true;
            const labels = layout.sections.map((s: any) => s?.label).join(', ');
            console.log(`[Nekocord/SettingsUI] Settings layout sections=[${labels}]`);
          }
          return res;
        }
        if (
          layout?.type !== 'list' ||
          !Array.isArray(layout?.sections) ||
          !Array.isArray(res) ||
          res.some((item: any) => NEKOCORD_KEYS.has(item?.setting))
        ) {
          return res;
        }

        if (!loggedInjection) {
          loggedInjection = true;
          console.log('[Nekocord/SettingsUI] Injected Nekocord section into User Settings');
        }
        ensureSearchListHooked();

        return [staticHeader, ...staticSectionRows, ...res];
      });
      cleanups.push(u);
    } catch (err) {
      console.error('[Nekocord/SettingsUI] Failed to patch toSettingListItems:', err);
    }
  }

  if (typeof listUtils.getSettingTitle === 'function') {
    try {
      const uTitle: Unpatch = after(listUtils, 'getSettingTitle', (args: any[], res: any) => {
        const hit = entryMap.get(args[0]);
        return hit ? hit.entry.title : res;
      });
      cleanups.push(uTitle);
    } catch (err) {
      console.error('[Nekocord/SettingsUI] Failed to patch getSettingTitle:', err);
    }
  }

  if (typeof listUtils.onRouteSettingOnPress === 'function') {
    try {
      const uRoute: Unpatch = instead(
        listUtils,
        'onRouteSettingOnPress',
        (args: any[], orig: (...a: any[]) => any) => {
          const hit = entryMap.get(args[0]);
          if (hit) {
            openNekocordSettings(hit.entry.tab);
            return;
          }
          return orig(...args);
        },
      );
      cleanups.push(uRoute);
    } catch (err) {
      console.error('[Nekocord/SettingsUI] Failed to patch onRouteSettingOnPress:', err);
    }
  }

  ensureSearchListHooked();
  if (!searchListHooked) {
    const cancelSearchListWait = waitFor(
      (m) =>
        typeof m === 'object' &&
        m !== null &&
        Object.prototype.hasOwnProperty.call(m, 'SearchableSettingsList'),
      (mod: any) => {
        hookSearchListModule(mod);
      },
    );
    cleanups.push(cancelSearchListWait);
  }

  if (typeof listUtils.getScoredSettingListSearchResultItems === 'function') {
    try {
      const uScored: Unpatch = after(
        listUtils,
        'getScoredSettingListSearchResultItems',
        (args: any[], res: any) => {
          ensureSearchListHooked();
          lastScoredWasLoading = args[1] === true;
          if (!Array.isArray(res)) {
            return res;
          }
          const nativeSample = res.find((item: any) => typeof item?.type === 'string' && item?.setting);
          if (nativeSample) {
            searchItemType = nativeSample.type;
          }
          return res;
        },
      );
      cleanups.push(uScored);
    } catch (err) {
      console.error('[Nekocord/SettingsUI] Failed to patch getScoredSettingListSearchResultItems:', err);
    }
  }

  if (typeof listUtils.getSettingListSearchResultItems === 'function') {
    try {
      const uSearch: Unpatch = after(
        listUtils,
        'getSettingListSearchResultItems',
        (args: any[], res: any) => {
          if (!Array.isArray(res)) {
            return res;
          }
          return buildMatchingSearchItems(res, args[0]);
        },
      );
      cleanups.push(uSearch);
    } catch (err) {
      console.error('[Nekocord/SettingsUI] Failed to patch getSettingListSearchResultItems:', err);
    }
  }
}

export default definePlugin({
  start() {
    cancelReactWait = onReactAndNative((React, ReactNative) => {
      const Overlay = createNekocordOverlay(React, ReactNative);
      const preload = getPreloadState();
      if (preload) {
        preload.rootWrapper = (Original: any) => wrapRootComponent(React, Overlay, Original);
      }
      console.log(
        `[Nekocord/SettingsUI] Registered rootWrapper (interceptedAppRegistry=${Boolean(preload?.interceptedAppRegistry)})`,
      );
    });

    const existingListUtils = findByProps('toSettingListItems', 'getSettingScreens');
    if (existingListUtils) {
      injectIntoUserSettingsList(existingListUtils, 'immediate');
    } else {
      console.log('[Nekocord/SettingsUI] Waiting for UserSettingsListUtils');
      const cancelWaitList = waitFor(
        (m) =>
          typeof m === 'object' &&
          m !== null &&
          Object.prototype.hasOwnProperty.call(m, 'toSettingListItems') &&
          Object.prototype.hasOwnProperty.call(m, 'getSettingScreens') &&
          typeof m.toSettingListItems === 'function',
        (mod) => {
          injectIntoUserSettingsList(mod, 'waitFor');
        },
      );
      cleanups.push(cancelWaitList);
    }
  },

  stop() {
    if (cancelReactWait) {
      cancelReactWait();
      cancelReactWait = null;
    }
    while (cleanups.length > 0) {
      const fn = cleanups.pop();
      fn?.();
    }
    const preload = getPreloadState();
    if (preload) {
      preload.rootWrapper = null;
    }
  },
});

export { openNekocordSettings };
