import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');
const pluginsDir = path.join(rootDir, 'runtime', 'src', 'plugins');
const registryOutPath = path.join(pluginsDir, 'registry.generated.ts');
const docsOutPath = path.join(rootDir, 'docs', 'PLUGINS.md');

const PRIORITY_NAMES = [
  'NekocordBanner',
  'NekocordSettingsUI',
  'NoTrack',
  'MessageLogger',
  'FakeNitro',
  'NoReplyMention',
  'ClearURLs',
  'DeveloperMode',
  'SilentTyping',
  'SilentMessages',
  'FixEmbeds',
  'NoBlockedMessages',
  'RevealAllSpoilers',
  'NoMosaic',
  'ShowMeYourName',
  'FullTimestamps',
  'SendTimestamps',
  'HideTyping',
  'NoSuperReactions',
  'MoreKaomoji',
  'Greentext',
  'MockingText',
  'ReverseText',
  'AlwaysTrust',
  'AlwaysAnimate',
  'HideAppsButton',
  'NoAvatarDecorations',
  'NoClanTags',
  'BetterRoleDot',
  'NoInlineForwardButton',
  'NoLinkDecorations',
  'NoProfileThemes',
  'NoPendingCount',
  'HideGiftButton',
  'UwUify',
  'MuteNewGuild',
  'RelationshipNotifier',
  'VoiceMuteOnJoin',
  'AnonymiseFileNames',
  'FakeDeafen',
  'Experiments',
  'NSFWGateBypass',
];

const PRIORITY_INDEX = new Map(PRIORITY_NAMES.map((name, idx) => [name, idx]));
const VALID_CATEGORIES = new Set([
  'core',
  'chat',
  'privacy',
  'nitro',
  'voice',
  'developer',
  'utility',
  'ui',
]);

function parseScalar(raw) {
  const trimmed = raw.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    if (trimmed.startsWith('"')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed.slice(1, -1);
      }
    }
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((item) => String(parseScalar(item)));
  }
  return trimmed;
}

function parseFrontmatter(markdownText, label) {
  const normalized = markdownText.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    throw new Error(`${label}: missing YAML frontmatter block`);
  }
  const endIdx = normalized.indexOf('\n---\n', 4);
  if (endIdx < 0) {
    throw new Error(`${label}: unterminated YAML frontmatter block`);
  }

  const yamlBlock = normalized.slice(4, endIdx);
  const body = normalized.slice(endIdx + 5).trim();
  const data = {};
  let currentListKey = null;

  for (const rawLine of yamlBlock.split('\n')) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trimStart().startsWith('#')) {
      continue;
    }
    const objStartMatch = /^\s+-\s+([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (objStartMatch && currentListKey && Array.isArray(data[currentListKey])) {
      const entry = { [objStartMatch[1]]: parseScalar(objStartMatch[2]) };
      data[currentListKey].push(entry);
      continue;
    }
    const objContMatch = /^\s{4,}([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (objContMatch && currentListKey && Array.isArray(data[currentListKey]) && data[currentListKey].length > 0) {
      const last = data[currentListKey][data[currentListKey].length - 1];
      if (last && typeof last === 'object' && !Array.isArray(last)) {
        last[objContMatch[1]] = parseScalar(objContMatch[2]);
        continue;
      }
    }
    const listMatch = /^\s+-\s+(.+)$/.exec(line);
    if (listMatch && currentListKey) {
      data[currentListKey].push(String(parseScalar(listMatch[1])));
      continue;
    }
    const kvMatch = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!kvMatch) {
      throw new Error(`${label}: invalid frontmatter line: ${line}`);
    }
    const key = kvMatch[1];
    const valueRaw = kvMatch[2];
    if (valueRaw === '') {
      data[key] = [];
      currentListKey = key;
    } else {
      data[key] = parseScalar(valueRaw);
      currentListKey = null;
    }
  }

  return { data, body };
}

function normalizeAuthors(rawAuthors, fallbackIcon) {
  const iconFallback =
    typeof fallbackIcon === 'string' && fallbackIcon.trim() ? fallbackIcon.trim() : '';
  const list = Array.isArray(rawAuthors) ? rawAuthors : [];
  const normalized = [];

  for (const entry of list) {
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
        typeof entry.github === 'string' && entry.github.trim() ? entry.github.trim() : '';
      normalized.push({
        name,
        ...(icon ? { icon } : {}),
        ...(github ? { github } : {}),
      });
    }
  }

  return normalized;
}

function escapeCell(text) {
  return String(text).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/**
 * Scans plugin directories and generates {@code registry.generated.ts} and {@code docs/PLUGINS.md}.
 */
export function generatePlugins() {
  const entries = readdirSync(pluginsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const seenNames = new Set();
  const parsed = [];

  for (const slug of entries) {
    const pluginRoot = path.join(pluginsDir, slug);
    const indexFile = path.join(pluginRoot, 'index.ts');
    const readmeFile = path.join(pluginRoot, 'README.md');

    if (!existsSync(indexFile)) {
      throw new Error(`Plugin directory "${slug}" is missing index.ts`);
    }
    if (!existsSync(readmeFile)) {
      throw new Error(`Plugin directory "${slug}" is missing README.md`);
    }

    const rawReadme = readFileSync(readmeFile, 'utf8');
    const { data, body } = parseFrontmatter(rawReadme, `runtime/src/plugins/${slug}/README.md`);

    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const description = typeof data.description === 'string' ? data.description.trim() : '';
    const category = typeof data.category === 'string' ? data.category.trim() : '';
    const fallbackIcon = typeof data.authorIcon === 'string' ? data.authorIcon.trim() : '';
    const authors = normalizeAuthors(data.authors, fallbackIcon);
    const authorIcon = authors[0]?.icon || fallbackIcon;

    if (!name || !description || !VALID_CATEGORIES.has(category) || authors.length === 0) {
      throw new Error(
        `runtime/src/plugins/${slug}/README.md has incomplete or invalid metadata`,
      );
    }
    if (seenNames.has(name)) {
      throw new Error(`Duplicate plugin name "${name}" in "${slug}"`);
    }
    seenNames.add(name);

    parsed.push({
      slug,
      name,
      description,
      authors,
      ...(authorIcon ? { authorIcon } : {}),
      category,
      core: Boolean(data.core),
      enabledByDefault: data.enabledByDefault === undefined ? false : Boolean(data.enabledByDefault),
      requiresRestart: Boolean(data.requiresRestart),
      isNew: Boolean(data.isNew),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      readme: body || description,
    });
  }

  parsed.sort((a, b) => {
    const pa = PRIORITY_INDEX.get(a.name);
    const pb = PRIORITY_INDEX.get(b.name);
    if (pa !== undefined && pb !== undefined) return pa - pb;
    if (pa !== undefined) return -1;
    if (pb !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });

  const imports = parsed.map(
    (p, idx) => `import plugin_${idx} from './${p.slug}/index.js';`,
  );

  const entriesCode = parsed.map((p, idx) => {
    const meta = {
      slug: p.slug,
      name: p.name,
      description: p.description,
      authors: p.authors,
      ...(p.authorIcon ? { authorIcon: p.authorIcon } : {}),
      category: p.category,
      ...(p.core ? { core: true } : {}),
      enabledByDefault: p.enabledByDefault,
      ...(p.requiresRestart ? { requiresRestart: true } : {}),
      ...(p.isNew ? { isNew: true } : {}),
      ...(p.tags.length > 0 ? { tags: p.tags } : {}),
      readme: p.readme,
    };
    return `  hydratePlugin(plugin_${idx}, ${JSON.stringify(meta)}),`;
  });

  const registrySource = [
    '// Auto-generated by runtime/scripts/generate-plugins.mjs. Do not edit manually.',
    "import { hydratePlugin, type NekocordPlugin } from './types.js';",
    ...imports,
    '',
    'export const builtinPlugins: NekocordPlugin[] = [',
    ...entriesCode,
    '];',
    '',
  ].join('\n');

  writeFileSync(registryOutPath, registrySource, 'utf8');

  const categoryOrder = [
    ['chat', 'Chat'],
    ['ui', 'UI'],
    ['privacy', 'Privacy'],
    ['utility', 'Utility'],
    ['developer', 'Developer'],
    ['nitro', 'Nitro'],
    ['voice', 'Voice'],
    ['core', 'Core'],
  ];

  const byCategory = new Map();
  for (const [key] of categoryOrder) {
    byCategory.set(key, []);
  }
  for (const plugin of parsed) {
    byCategory.get(plugin.category).push(plugin);
  }

  const visibleCount = parsed.filter((p) => !p.core).length;
  const docLines = [
    '# Nekocord Built-in Plugins',
    '',
    `Nekocord ships with **${parsed.length}** built-in plugins (**${visibleCount}** user-toggleable plugins and **${parsed.length - visibleCount}** core runtime plugins). Each plugin lives in its own directory under \`runtime/src/plugins/<slug>/\` with \`index.ts\` and \`README.md\` metadata.`,
    '',
  ];

  for (const [key, title] of categoryOrder) {
    const items = byCategory.get(key) ?? [];
    if (items.length === 0) continue;
    docLines.push(`## ${title} (${items.length})`, '');
    docLines.push('| Plugin | Default | Restart | Description |');
    docLines.push('| :--- | :--- | :--- | :--- |');
    for (const p of items.slice().sort((a, b) => a.name.localeCompare(b.name))) {
      const link = `[${p.name}](../runtime/src/plugins/${p.slug}/README.md)`;
      const def = p.enabledByDefault ? 'On' : 'Off';
      const rst = p.requiresRestart ? 'Yes' : 'No';
      docLines.push(`| ${link} | ${def} | ${rst} | ${escapeCell(p.description)} |`);
    }
    docLines.push('');
  }

  mkdirSync(path.dirname(docsOutPath), { recursive: true });
  writeFileSync(docsOutPath, docLines.join('\n'), 'utf8');

  return {
    total: parsed.length,
    visible: visibleCount,
    core: parsed.length - visibleCount,
  };
}

const isEntrypoint =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const summary = generatePlugins();
  console.log(
    `Generated plugin registry (${summary.total} total: ${summary.visible} visible, ${summary.core} core)`,
  );
}
