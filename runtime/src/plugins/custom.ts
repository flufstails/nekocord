import type { StoredCustomPlugin } from '../storage/index.js';
import { definePluginSettings, OptionType } from './settings.js';
import {
  definePlugin,
  hydratePlugin,
  type NekocordPlugin,
  type PluginCategory,
  type PluginImplementation,
} from './types.js';

const VALID_CATEGORIES = new Set<PluginCategory>([
  'chat',
  'ui',
  'privacy',
  'utility',
  'developer',
  'nitro',
  'voice',
]);

export const EXAMPLE_CUSTOM_PLUGIN_CODE = `// @name GreetingLogger
// @description Logs a welcome toast to Notification Log on startup.
// @author flufstails
// @category utility
// @tags custom, notifications

export default definePlugin({
  start() {
    Nekocord.notifications.push({
      title: 'GreetingLogger Ready',
      body: 'Custom runtime plugin started successfully.',
      source: 'GreetingLogger',
      kind: 'success',
    });
  },
  stop() {},
});`;

interface ParsedPluginHeader {
  name?: string;
  description?: string;
  author?: string;
  authorIcon?: string;
  category?: PluginCategory;
  tags?: string[];
}

export function parsePluginHeaderMeta(code: string): ParsedPluginHeader {
  const out: ParsedPluginHeader = {};
  const lines = code.replace(/\r\n/g, '\n').split('\n').slice(0, 40);

  for (let i = 0; i < lines.length; i += 1) {
    const match = /^\s*(?:\/\/|\*)\s*@([a-zA-Z]+)\s+(.+)$/.exec(lines[i]);
    if (!match) continue;
    const tag = match[1].toLowerCase();
    const val = match[2].trim();
    if (!val) continue;

    if (tag === 'name' && !out.name) out.name = val;
    else if (tag === 'description' && !out.description) out.description = val;
    else if ((tag === 'author' || tag === 'authors') && !out.author) out.author = val;
    else if ((tag === 'authoricon' || tag === 'icon') && !out.authorIcon) out.authorIcon = val;
    else if (tag === 'category' && VALID_CATEGORIES.has(val.toLowerCase() as PluginCategory)) {
      out.category = val.toLowerCase() as PluginCategory;
    } else if (tag === 'tags') {
      out.tags = val
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }
  return out;
}

function slugifyPluginName(name: string): string {
  const clean = name
    .replace(/[^a-zA-Z0-9]+/g, '')
    .trim();
  return clean ? `custom_${clean.charAt(0).toLowerCase()}${clean.slice(1)}` : `custom_${Date.now()}`;
}

function transformPluginSource(rawCode: string): string {
  return rawCode
    .replace(/\r\n/g, '\n')
    .replace(/^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"][^'"]+['"]\s*;?[ \t]*$/gm, '')
    .replace(/^\s*export\s+default\s+/gm, 'module.exports = ');
}

/**
 * Evaluates a stored custom JS plugin and hydrates it into a live {@link NekocordPlugin}.
 */
export function compileCustomPlugin(
  stored: StoredCustomPlugin,
  fallbackName?: string,
): {
  ok: boolean;
  plugin?: NekocordPlugin;
  error?: string;
} {
  const body = transformPluginSource(stored.code);
  const mod: { exports: any } = { exports: {} };

  try {
    const factory = new Function(
      'Nekocord',
      'definePlugin',
      'definePluginSettings',
      'OptionType',
      'module',
      'exports',
      body,
    );
    const returned = factory(
      globalThis.Nekocord,
      definePlugin,
      definePluginSettings,
      OptionType,
      mod,
      mod.exports,
    );
    const resolved =
      (returned && typeof returned === 'object' ? returned : null) ??
      (mod.exports?.default && typeof mod.exports.default === 'object'
        ? mod.exports.default
        : mod.exports && typeof mod.exports === 'object' && Object.keys(mod.exports).length > 0
          ? mod.exports
          : null);

    if (!resolved || typeof resolved !== 'object') {
      return {
        ok: false,
        error: 'Plugin code must export a plugin object via "export default definePlugin(...)" or "module.exports = ...".',
      };
    }

    const impl = resolved as PluginImplementation;
    const rawName = (stored.name || impl.name || fallbackName || '').trim();
    const name = rawName.replace(/\s+/g, '');
    if (!name) {
      return { ok: false, error: 'Plugin must declare a name (e.g. "// @name MyPlugin").' };
    }

    const hydrated = hydratePlugin(impl, {
      slug: stored.slug || slugifyPluginName(name),
      name,
      description: stored.description || impl.description || 'User-imported custom plugin.',
      authors: stored.authors,
      ...(stored.authorIcon ? { authorIcon: stored.authorIcon } : {}),
      category: (VALID_CATEGORIES.has(stored.category as PluginCategory)
        ? stored.category
        : 'utility') as PluginCategory,
      enabledByDefault: true,
      tags: stored.tags ?? ['custom'],
      readme: stored.readme || stored.description || 'User-imported custom plugin.',
    });

    hydrated.imported = true;
    if (stored.sourceUrl) {
      hydrated.sourceUrl = stored.sourceUrl;
    }

    return { ok: true, plugin: hydrated };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to compile plugin source.',
    };
  }
}

/**
 * Validates raw JS plugin source and constructs a persisted {@link StoredCustomPlugin}.
 */
export function buildStoredCustomPluginFromCode(
  code: string,
  options?: { name?: string; sourceUrl?: string; blockedCoreNames?: Set<string> },
): { ok: boolean; stored?: StoredCustomPlugin; plugin?: NekocordPlugin; error?: string } {
  const trimmed = typeof code === 'string' ? code.trim() : '';
  if (!trimmed) {
    return { ok: false, error: 'Paste JavaScript plugin code first.' };
  }

  const header = parsePluginHeaderMeta(trimmed);
  const urlStem = options?.sourceUrl
    ? options.sourceUrl
        .split('?')[0]
        .split('/')
        .pop()
        ?.replace(/\.m?[jt]s$/i, '')
        ?.replace(/\s+/g, '')
    : undefined;
  const explicitName = (options?.name?.trim() || header.name || '').replace(/\s+/g, '');

  const tempStored: StoredCustomPlugin = {
    id: `custom-${Date.now().toString(36)}`,
    slug: explicitName ? slugifyPluginName(explicitName) : '',
    name: explicitName,
    description: header.description || 'User-imported custom plugin.',
    authors: [
      {
        name: header.author || 'flufstails',
        ...(header.authorIcon ? { icon: header.authorIcon } : {}),
      },
    ],
    ...(header.authorIcon ? { authorIcon: header.authorIcon } : {}),
    category: header.category ?? 'utility',
    ...(options?.sourceUrl ? { sourceUrl: options.sourceUrl } : {}),
    code: trimmed,
    tags: header.tags?.length ? header.tags : ['custom'],
    readme: header.description
      ? `# ${explicitName || 'CustomPlugin'}\n\n${header.description}`
      : undefined,
    installedAt: Date.now(),
  };

  const compiled = compileCustomPlugin(tempStored, urlStem);
  if (!compiled.ok || !compiled.plugin) {
    return { ok: false, error: compiled.error };
  }

  if (options?.blockedCoreNames?.has(compiled.plugin.name)) {
    return {
      ok: false,
      error: `Cannot overwrite core runtime plugin "${compiled.plugin.name}".`,
    };
  }

  const finalSlug = slugifyPluginName(compiled.plugin.name);
  compiled.plugin.slug = finalSlug;
  tempStored.name = compiled.plugin.name;
  tempStored.slug = finalSlug;
  tempStored.description = compiled.plugin.description;
  tempStored.authors = compiled.plugin.authors;
  tempStored.authorIcon = compiled.plugin.authorIcon;
  tempStored.category = compiled.plugin.category;
  tempStored.id = `custom-${finalSlug}`;
  if (!tempStored.readme) {
    tempStored.readme = `# ${compiled.plugin.name}\n\n${compiled.plugin.description}`;
  }

  return { ok: true, stored: tempStored, plugin: compiled.plugin };
}

/**
 * Fetches plugin JS source from an HTTP/HTTPS URL and builds a validated {@link StoredCustomPlugin}.
 */
export async function fetchCustomPluginFromUrl(
  rawUrl: string,
  blockedCoreNames?: Set<string>,
): Promise<{ ok: boolean; stored?: StoredCustomPlugin; plugin?: NekocordPlugin; error?: string }> {
  const url = rawUrl.trim();
  if (!/^https?:\/\/\S+$/i.test(url)) {
    return { ok: false, error: 'Enter a valid http:// or https:// plugin .js URL.' };
  }
  const fetchFn = (globalThis as Record<string, any>).fetch as
    | ((input: string, init?: any) => Promise<any>)
    | undefined;
  if (typeof fetchFn !== 'function') {
    return { ok: false, error: 'Fetch API is unavailable in this runtime.' };
  }

  try {
    const res = await fetchFn(url);
    if (!res.ok) {
      return { ok: false, error: `Download failed with HTTP ${res.status}.` };
    }
    const text = await res.text();
    return buildStoredCustomPluginFromCode(text, { sourceUrl: url, blockedCoreNames });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to fetch plugin URL.',
    };
  }
}
