import type { DefinedPluginSettings } from './settings.js';

export type PluginCategory =
  | 'core'
  | 'chat'
  | 'privacy'
  | 'nitro'
  | 'voice'
  | 'developer'
  | 'utility'
  | 'ui';

export interface PluginReadmeMeta {
  slug: string;
  name: string;
  description: string;
  authors: string[];
  category: PluginCategory;
  core?: boolean;
  enabledByDefault?: boolean;
  requiresRestart?: boolean;
  isNew?: boolean;
  tags?: string[];
  readme: string;
}

export interface PluginImplementation {
  name?: string;
  description?: string;
  authors?: string[];
  category?: PluginCategory;
  core?: boolean;
  enabledByDefault?: boolean;
  requiresRestart?: boolean;
  isNew?: boolean;
  dependencies?: string[];
  settings?: DefinedPluginSettings<any>;
  tags?: string[];
  start?(): void;
  stop?(): void;
}

export interface NekocordPlugin extends PluginReadmeMeta {
  dependencies?: string[];
  settings?: DefinedPluginSettings<any>;
  start?(): void;
  stop?(): void;
}

export type PurrcordPlugin = NekocordPlugin;

export function definePlugin<T extends PluginImplementation>(plugin: T): T {
  return plugin;
}

export function hydratePlugin(
  impl: PluginImplementation,
  meta: PluginReadmeMeta,
): NekocordPlugin {
  const resolvedName = meta.name || impl.name || meta.slug;
  if (impl.settings && typeof impl.settings._bindPluginName === 'function') {
    impl.settings._bindPluginName(resolvedName);
  }
  return {
    ...impl,
    ...meta,
    name: resolvedName,
    description: meta.description || impl.description || '',
    authors: meta.authors.length > 0 ? meta.authors : (impl.authors ?? ['flufstails']),
    category: meta.category ?? impl.category ?? 'utility',
  };
}
