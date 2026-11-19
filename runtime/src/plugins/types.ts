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
  tags?: string[];
  start?(): void;
  stop?(): void;
}

export interface NekocordPlugin extends PluginReadmeMeta {
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
  return {
    ...impl,
    ...meta,
    name: meta.name || impl.name || meta.slug,
    description: meta.description || impl.description || '',
    authors: meta.authors.length > 0 ? meta.authors : (impl.authors ?? ['flufstails']),
    category: meta.category ?? impl.category ?? 'utility',
  };
}
