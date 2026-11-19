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

export interface PluginAuthor {
  name: string;
  icon?: string;
  github?: string;
}

export type PluginAuthorInput = string | PluginAuthor;

export interface PluginReadmeMeta {
  slug: string;
  name: string;
  description: string;
  authors: PluginAuthor[];
  authorIcon?: string;
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
  authors?: PluginAuthorInput[];
  authorIcon?: string;
  category?: PluginCategory;
  core?: boolean;
  enabledByDefault?: boolean;
  requiresRestart?: boolean;
  isNew?: boolean;
  imported?: boolean;
  sourceUrl?: string;
  dependencies?: string[];
  settings?: DefinedPluginSettings<any>;
  tags?: string[];
  start?(): void;
  stop?(): void;
}

export interface NekocordPlugin extends PluginReadmeMeta {
  imported?: boolean;
  sourceUrl?: string;
  dependencies?: string[];
  settings?: DefinedPluginSettings<any>;
  start?(): void;
  stop?(): void;
}

export type PurrcordPlugin = NekocordPlugin;

export function definePlugin<T extends PluginImplementation>(plugin: T): T {
  return plugin;
}

/**
 * Normalizes mixed string/object author metadata entries into {@link PluginAuthor} records.
 */
export function normalizePluginAuthors(
  input?: PluginAuthorInput[],
  fallbackIcon?: string,
): PluginAuthor[] {
  const iconFallback =
    typeof fallbackIcon === 'string' && fallbackIcon.trim() ? fallbackIcon.trim() : undefined;
  const list = Array.isArray(input) ? input : [];
  const normalized: PluginAuthor[] = [];

  for (let i = 0; i < list.length; i += 1) {
    const entry = list[i];
    if (typeof entry === 'string') {
      const name = entry.trim();
      if (!name) continue;
      normalized.push({
        name,
        ...(iconFallback ? { icon: iconFallback } : {}),
      });
    } else if (entry && typeof entry === 'object' && typeof entry.name === 'string') {
      const name = entry.name.trim();
      if (!name) continue;
      const icon =
        typeof entry.icon === 'string' && entry.icon.trim() ? entry.icon.trim() : iconFallback;
      const github =
        typeof entry.github === 'string' && entry.github.trim() ? entry.github.trim() : undefined;
      normalized.push({
        name,
        ...(icon ? { icon } : {}),
        ...(github ? { github } : {}),
      });
    }
  }

  return normalized;
}

export function hydratePlugin(
  impl: PluginImplementation,
  meta: PluginReadmeMeta,
): NekocordPlugin {
  const resolvedName = meta.name || impl.name || meta.slug;
  if (impl.settings && typeof impl.settings._bindPluginName === 'function') {
    impl.settings._bindPluginName(resolvedName);
  }
  const fallbackIcon = meta.authorIcon ?? impl.authorIcon;
  const metaAuthors = normalizePluginAuthors(meta.authors, fallbackIcon);
  const implAuthors = normalizePluginAuthors(impl.authors, fallbackIcon);
  const authors =
    metaAuthors.length > 0
      ? metaAuthors
      : implAuthors.length > 0
        ? implAuthors
        : normalizePluginAuthors(['flufstails'], fallbackIcon);
  const resolvedAuthorIcon = meta.authorIcon || authors[0]?.icon || impl.authorIcon;
  const isNew = Boolean(meta.isNew || impl.isNew);

  return {
    ...impl,
    ...meta,
    name: resolvedName,
    description: meta.description || impl.description || '',
    authors,
    ...(resolvedAuthorIcon ? { authorIcon: resolvedAuthorIcon } : {}),
    ...(isNew ? { isNew: true } : {}),
    category: meta.category ?? impl.category ?? 'utility',
  };
}
