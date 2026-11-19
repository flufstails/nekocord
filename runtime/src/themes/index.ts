import {
  type ComponentPatchTarget,
  findByProps,
  getModules,
  waitFor,
  watchNamedExports,
} from '../metro/index.js';
import { getThemeStore } from '../metro/common.js';
import { after, instead, type Unpatch } from '../patcher/index.js';
import {
  addCustomTheme,
  getActiveThemeId,
  getCustomThemes,
  removeCustomTheme,
  setActiveThemeId,
  subscribeSettings,
  type StoredNekocordTheme,
} from '../storage/index.js';

export interface NekocordTheme extends StoredNekocordTheme {
  builtin?: boolean;
}

export type PurrcordTheme = NekocordTheme;

export interface NekocordUiThemeOverrides {
  canvas?: string;
  headerBg?: string;
  surface?: string;
  surfaceAlt?: string;
  surfaceHighlight?: string;
  divider?: string;
  border?: string;
  textPrimary?: string;
  textSecondary?: string;
  textMuted?: string;
  brand?: string;
}

const TOKEN_ALIASES: Record<string, string[]> = {
  BACKGROUND_PRIMARY: ['BG_BASE_PRIMARY', 'BACKGROUND_BASE_LOW', 'CHAT_BACKGROUND'],
  BACKGROUND_SECONDARY: ['BG_BASE_SECONDARY', 'BACKGROUND_BASE_LOWER', 'CARD_PRIMARY_BG'],
  BACKGROUND_TERTIARY: ['BG_BASE_TERTIARY', 'BACKGROUND_BASE_LOWEST', 'BACKGROUND_SURFACE_HIGH'],
  BACKGROUND_MOBILE_PRIMARY: ['BG_BASE_PRIMARY', 'BACKGROUND_BASE_LOW', 'BACKGROUND_PRIMARY'],
  BACKGROUND_MOBILE_SECONDARY: ['BG_BASE_SECONDARY', 'BACKGROUND_BASE_LOWER', 'BACKGROUND_SECONDARY'],
  CHAT_BACKGROUND: ['BG_BASE_PRIMARY', 'BACKGROUND_BASE_LOW', 'BACKGROUND_PRIMARY'],
  CHAT_BACKGROUND_DEFAULT: ['BACKGROUND_PRIMARY', 'BG_BASE_PRIMARY', 'BACKGROUND_BASE_LOW', 'CHAT_BACKGROUND'],
  MOBILE_BACKGROUND_PRIMARY: ['BACKGROUND_PRIMARY', 'BG_BASE_PRIMARY', 'BACKGROUND_BASE_LOW', 'CHAT_BACKGROUND'],
  MOBILE_BACKGROUND_SECONDARY: ['BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY', 'BACKGROUND_BASE_LOWER'],
  TEXT_NORMAL: ['TEXT_DEFAULT', 'TEXT_PRIMARY', 'TEXT_STRONG'],
  TEXT_MUTED: ['TEXT_SECONDARY'],
  TEXT_SUBTLE: ['TEXT_MUTED', 'TEXT_SECONDARY'],
  HEADER_PRIMARY: ['TEXT_STRONG', 'TEXT_PRIMARY', 'TEXT_DEFAULT'],
  HEADER_SECONDARY: ['TEXT_MUTED', 'TEXT_SECONDARY'],
  CARD_PRIMARY_BG: ['BACKGROUND_SURFACE_HIGH', 'BG_BASE_SECONDARY', 'BACKGROUND_SECONDARY'],
  CARD_SECONDARY_BG: ['BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY', 'BACKGROUND_BASE_LOWER'],
  BRAND_500: ['BG_BRAND'],
  BACKGROUND_BRAND: ['BRAND_500', 'BG_BRAND'],
  BG_BASE_PRIMARY: ['BACKGROUND_PRIMARY', 'CHAT_BACKGROUND', 'BACKGROUND_MOBILE_PRIMARY'],
  BG_BASE_SECONDARY: ['BACKGROUND_SECONDARY', 'BACKGROUND_MOBILE_SECONDARY', 'CARD_PRIMARY_BG'],
  BG_BASE_TERTIARY: ['BACKGROUND_TERTIARY', 'BACKGROUND_BASE_LOWEST'],
  BACKGROUND_BASE_LOW: ['BACKGROUND_PRIMARY', 'BG_BASE_PRIMARY', 'CHAT_BACKGROUND'],
  BACKGROUND_BASE_LOWER: ['BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY'],
  BACKGROUND_BASE_LOWEST: ['BACKGROUND_TERTIARY', 'BG_BASE_TERTIARY'],
  BACKGROUND_SURFACE_HIGH: ['CARD_PRIMARY_BG', 'BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY'],
  BACKGROUND_SURFACE_HIGHER: ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH', 'BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY'],
  BACKGROUND_SURFACE_HIGHEST: ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH', 'BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY'],
  BG_SURFACE_RAISED: ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH', 'BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY'],
  BACKGROUND_FLOATING: ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH', 'BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY'],
  BACKGROUND_MOD_SUBTLE: ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH', 'BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY'],
  BACKGROUND_MOD_MUTED: ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH', 'BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY'],
  BACKGROUND_MOD_NORMAL: ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH', 'BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY'],
  BACKGROUND_MOD_STRONG: ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH', 'BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY'],
  BG_MOD_FAINT: ['BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY'],
  TEXT_DEFAULT: ['TEXT_NORMAL', 'TEXT_PRIMARY'],
  TEXT_PRIMARY: ['TEXT_NORMAL', 'HEADER_PRIMARY', 'TEXT_DEFAULT'],
  TEXT_STRONG: ['HEADER_PRIMARY', 'TEXT_NORMAL'],
  TEXT_SECONDARY: ['TEXT_MUTED'],
  BG_BRAND: ['BRAND_500'],
  MOBILE_TEXT_HEADING_PRIMARY: ['HEADER_PRIMARY', 'TEXT_NORMAL'],
  INTERACTIVE_TEXT_ACTIVE: ['HEADER_PRIMARY', 'TEXT_NORMAL'],
  INTERACTIVE_ACTIVE: ['HEADER_PRIMARY', 'TEXT_NORMAL'],
  ICON_STRONG: ['HEADER_PRIMARY', 'TEXT_NORMAL'],
  MOBILE_TEXT_HEADING_SECONDARY: ['TEXT_MUTED', 'TEXT_SECONDARY', 'TEXT_NORMAL'],
  CHANNEL_ICON: ['TEXT_MUTED', 'TEXT_SECONDARY', 'TEXT_NORMAL'],
  ICON_MUTED: ['TEXT_MUTED', 'TEXT_SECONDARY', 'TEXT_NORMAL'],
  INTERACTIVE_NORMAL: ['TEXT_MUTED', 'TEXT_SECONDARY', 'TEXT_NORMAL'],
  INTERACTIVE_MUTED: ['TEXT_MUTED', 'TEXT_SECONDARY', 'TEXT_NORMAL'],
  BACKGROUND_NESTED_FLOATING: ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH', 'BACKGROUND_SECONDARY'],
  BACKGROUND_SECONDARY_ALT: ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH', 'BACKGROUND_SECONDARY'],
  CARD_PRIMARY_PRESSED_BG: ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH', 'BACKGROUND_SECONDARY'],
  CARD_SECONDARY_PRESSED_BG: ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH', 'BACKGROUND_SECONDARY'],
  CONTROL_BRAND_FOREGROUND: ['BRAND_500', 'BG_BRAND'],
  CONTROL_BRAND_FOREGROUND_NEW: ['BRAND_500', 'BG_BRAND'],
};

function buildDarkRawRamp(
  base: string,
  lower: string,
  lowest: string,
  raised: string,
  brand?: string,
): Record<string, string> {
  return {
    PRIMARY_560: raised,
    PRIMARY_600: base,
    PRIMARY_630: lower,
    PRIMARY_660: lowest,
    PRIMARY_700: raised,
    PRIMARY_800: lowest,
    PRIMARY_860: lowest,
    PRIMARY_900: lowest,
    PLUM_15: raised,
    PLUM_16: raised,
    PLUM_17: raised,
    PLUM_18: base,
    PLUM_19: lower,
    PLUM_20: base,
    PLUM_21: lower,
    PLUM_22: lowest,
    PLUM_23: lowest,
    PLUM_24: lowest,
    PLUM_25: lowest,
    PLUM_26: lowest,
    NEUTRAL_60: raised,
    NEUTRAL_62: raised,
    NEUTRAL_64: raised,
    NEUTRAL_65: raised,
    NEUTRAL_66: raised,
    NEUTRAL_69: raised,
    NEUTRAL_71: raised,
    NEUTRAL_72: raised,
    NEUTRAL_73: raised,
    NEUTRAL_74: base,
    NEUTRAL_76: base,
    NEUTRAL_79: base,
    NEUTRAL_80: base,
    NEUTRAL_82: lower,
    NEUTRAL_86: lower,
    NEUTRAL_88: lowest,
    NEUTRAL_90: lowest,
    NEUTRAL_92: lowest,
    NEUTRAL_96: lowest,
    ...(brand
      ? {
          BRAND_400: brand,
          BRAND_430: brand,
          BRAND_460: brand,
          BRAND_500: brand,
          BRAND_530: brand,
          BRAND_560: brand,
        }
      : {}),
  };
}

function buildLightRawRamp(
  base: string,
  lower: string,
  lowest: string,
  darkBase: string,
  darkLower: string,
  darkLowest: string,
  brand?: string,
): Record<string, string> {
  return {
    PRIMARY_100: base,
    PRIMARY_130: lower,
    PRIMARY_160: lowest,
    PRIMARY_200: lowest,
    PRIMARY_600: darkBase,
    PRIMARY_630: darkLower,
    PRIMARY_660: darkLowest,
    NEUTRAL_1: base,
    NEUTRAL_2: base,
    NEUTRAL_4: base,
    NEUTRAL_5: base,
    NEUTRAL_6: lower,
    NEUTRAL_8: lower,
    NEUTRAL_10: lowest,
    NEUTRAL_12: lowest,
    NEUTRAL_15: lowest,
    ...(brand
      ? {
          BRAND_400: brand,
          BRAND_430: brand,
          BRAND_460: brand,
          BRAND_500: brand,
          BRAND_530: brand,
          BRAND_560: brand,
        }
      : {}),
  };
}

let cachedEffectiveTheme: NekocordTheme | null = null;
let cachedEffectiveRawColors: Record<string, string> = {};

let cachedActiveThemeId: string | null | undefined = undefined;
let cachedActiveThemeObj: NekocordTheme | null = null;
const semanticLookupCache = new Map<string, string | null>();
const rawLookupCache = new Map<string, string | null>();

function invalidateThemeCache(): void {
  cachedActiveThemeId = undefined;
  cachedActiveThemeObj = null;
  cachedEffectiveTheme = null;
  cachedEffectiveRawColors = {};
  semanticLookupCache.clear();
  rawLookupCache.clear();
}

function computeEffectiveRawColors(theme: NekocordTheme): Record<string, string> {
  if (cachedEffectiveTheme === theme) {
    return cachedEffectiveRawColors;
  }
  const base = lookupSemanticTokenColor(theme, 'BACKGROUND_PRIMARY', 'dark') ?? theme.rawColors?.PRIMARY_600;
  const lower = lookupSemanticTokenColor(theme, 'BACKGROUND_SECONDARY', 'dark') ?? theme.rawColors?.PRIMARY_630;
  const lowest = lookupSemanticTokenColor(theme, 'BACKGROUND_TERTIARY', 'dark') ?? theme.rawColors?.PRIMARY_660;
  const raised =
    lookupSemanticTokenColor(theme, 'CARD_PRIMARY_BG', 'dark') ??
    lookupSemanticTokenColor(theme, 'BACKGROUND_SURFACE_HIGH', 'dark') ??
    theme.rawColors?.PRIMARY_700;
  const brand = lookupSemanticTokenColor(theme, 'BRAND_500', 'dark') ?? theme.rawColors?.BRAND_500;

  let synthesized: Record<string, string> = {};
  if (theme.baseMode === 'light') {
    const lightBase = lookupSemanticTokenColor(theme, 'BACKGROUND_PRIMARY', 'light');
    const lightLower = lookupSemanticTokenColor(theme, 'BACKGROUND_SECONDARY', 'light');
    const lightLowest = lookupSemanticTokenColor(theme, 'BACKGROUND_TERTIARY', 'light');
    const lightBrand = lookupSemanticTokenColor(theme, 'BRAND_500', 'light') ?? brand;
    if (lightBase && base) {
      synthesized = buildLightRawRamp(
        lightBase,
        lightLower ?? lightBase,
        lightLowest ?? lightLower ?? lightBase,
        base,
        lower ?? base,
        lowest ?? lower ?? base,
        lightBrand ?? undefined,
      );
    }
  } else if (base) {
    synthesized = buildDarkRawRamp(
      base,
      lower ?? base,
      lowest ?? lower ?? base,
      raised ?? lower ?? base,
      brand ?? undefined,
    );
  }

  const merged: Record<string, string> = {
    ...synthesized,
    ...(theme.rawColors ?? {}),
  };
  cachedEffectiveTheme = theme;
  cachedEffectiveRawColors = merged;
  return merged;
}

export const BUILTIN_THEMES: NekocordTheme[] = [
  {
    id: 'amoled-pitch',
    name: 'AMOLED Pitch',
    description: 'True black OLED surfaces with deep ink panels and crisp contrast.',
    authors: ['flufstails'],
    spec: 2,
    builtin: true,
    baseMode: 'dark',
    preview: ['#000000', '#0a0a0c', '#5865f2'],
    semanticColors: {
      BACKGROUND_PRIMARY: ['#000000', '#ffffff'],
      BACKGROUND_SECONDARY: ['#09090b', '#f2f3f5'],
      BACKGROUND_TERTIARY: ['#111115', '#e3e5e8'],
      BACKGROUND_MOBILE_PRIMARY: ['#000000', '#ffffff'],
      BACKGROUND_MOBILE_SECONDARY: ['#09090b', '#f2f3f5'],
      CHAT_BACKGROUND: ['#000000', '#ffffff'],
      CARD_PRIMARY_BG: ['#0e0e12', '#ffffff'],
      BG_BASE_PRIMARY: ['#000000', '#ffffff'],
      BG_BASE_SECONDARY: ['#09090b', '#f2f3f5'],
      BG_BASE_TERTIARY: ['#111115', '#e3e5e8'],
      BACKGROUND_BASE_LOW: ['#000000', '#ffffff'],
      BACKGROUND_BASE_LOWER: ['#09090b', '#f2f3f5'],
      BACKGROUND_BASE_LOWEST: ['#050507', '#ebedef'],
      BACKGROUND_SURFACE_HIGH: ['#121216', '#f7f8fa'],
      TEXT_NORMAL: ['#f5f6f8', '#060607'],
      TEXT_MUTED: ['#8b8f9a', '#6d6f78'],
      HEADER_PRIMARY: ['#ffffff', '#060607'],
    },
    rawColors: buildDarkRawRamp('#000000', '#09090b', '#050507', '#121216'),
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    description: 'Warm pastel lavender and midnight slate theme.',
    authors: ['flufstails'],
    spec: 2,
    builtin: true,
    baseMode: 'dark',
    preview: ['#1e1e2e', '#181825', '#cba6f7'],
    semanticColors: {
      BACKGROUND_PRIMARY: ['#1e1e2e', '#eff1f5'],
      BACKGROUND_SECONDARY: ['#181825', '#e6e9ef'],
      BACKGROUND_TERTIARY: ['#11111b', '#dce0e8'],
      BACKGROUND_MOBILE_PRIMARY: ['#1e1e2e', '#eff1f5'],
      BACKGROUND_MOBILE_SECONDARY: ['#181825', '#e6e9ef'],
      CHAT_BACKGROUND: ['#1e1e2e', '#eff1f5'],
      CARD_PRIMARY_BG: ['#242436', '#ffffff'],
      BG_BASE_PRIMARY: ['#1e1e2e', '#eff1f5'],
      BG_BASE_SECONDARY: ['#181825', '#e6e9ef'],
      BG_BASE_TERTIARY: ['#11111b', '#dce0e8'],
      BACKGROUND_BASE_LOW: ['#1e1e2e', '#eff1f5'],
      BACKGROUND_BASE_LOWER: ['#181825', '#e6e9ef'],
      BACKGROUND_BASE_LOWEST: ['#11111b', '#dce0e8'],
      BACKGROUND_SURFACE_HIGH: ['#29293e', '#ffffff'],
      TEXT_NORMAL: ['#cdd6f4', '#4c4f69'],
      TEXT_MUTED: ['#9399b2', '#6c6f85'],
      HEADER_PRIMARY: ['#f5e0dc', '#4c4f69'],
      BRAND_500: ['#cba6f7', '#8839ef'],
    },
    rawColors: buildDarkRawRamp('#1e1e2e', '#181825', '#11111b', '#29293e', '#cba6f7'),
  },
  {
    id: 'rose-pine',
    name: 'Rose Pine',
    description: 'Muted velvet plum panels with soft rose and iris highlights.',
    authors: ['flufstails'],
    spec: 2,
    builtin: true,
    baseMode: 'dark',
    preview: ['#191724', '#1f1d2e', '#ebbcba'],
    semanticColors: {
      BACKGROUND_PRIMARY: ['#191724', '#faf4ed'],
      BACKGROUND_SECONDARY: ['#1f1d2e', '#fffaf3'],
      BACKGROUND_TERTIARY: ['#26233a', '#f2e9e1'],
      BACKGROUND_MOBILE_PRIMARY: ['#191724', '#faf4ed'],
      BACKGROUND_MOBILE_SECONDARY: ['#1f1d2e', '#fffaf3'],
      CHAT_BACKGROUND: ['#191724', '#faf4ed'],
      CARD_PRIMARY_BG: ['#232136', '#fffaf3'],
      BG_BASE_PRIMARY: ['#191724', '#faf4ed'],
      BG_BASE_SECONDARY: ['#1f1d2e', '#fffaf3'],
      BG_BASE_TERTIARY: ['#26233a', '#f2e9e1'],
      BACKGROUND_BASE_LOW: ['#191724', '#faf4ed'],
      BACKGROUND_BASE_LOWER: ['#1f1d2e', '#fffaf3'],
      BACKGROUND_BASE_LOWEST: ['#14121d', '#f2e9e1'],
      BACKGROUND_SURFACE_HIGH: ['#2a273f', '#fffaf3'],
      TEXT_NORMAL: ['#e0def4', '#575279'],
      TEXT_MUTED: ['#908caa', '#797593'],
      HEADER_PRIMARY: ['#f6c177', '#575279'],
      BRAND_500: ['#c4a7e7', '#907aa9'],
    },
    rawColors: buildDarkRawRamp('#191724', '#1f1d2e', '#14121d', '#2a273f', '#c4a7e7'),
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    description: 'Cool arctic slate palette with glacier cyan accents.',
    authors: ['flufstails'],
    spec: 2,
    builtin: true,
    baseMode: 'dark',
    preview: ['#2e3440', '#3b4252', '#88c0d0'],
    semanticColors: {
      BACKGROUND_PRIMARY: ['#2e3440', '#eceff4'],
      BACKGROUND_SECONDARY: ['#3b4252', '#e5e9f0'],
      BACKGROUND_TERTIARY: ['#242933', '#d8dee9'],
      BACKGROUND_MOBILE_PRIMARY: ['#2e3440', '#eceff4'],
      BACKGROUND_MOBILE_SECONDARY: ['#3b4252', '#e5e9f0'],
      CHAT_BACKGROUND: ['#2e3440', '#eceff4'],
      CARD_PRIMARY_BG: ['#434c5e', '#ffffff'],
      BG_BASE_PRIMARY: ['#2e3440', '#eceff4'],
      BG_BASE_SECONDARY: ['#3b4252', '#e5e9f0'],
      BG_BASE_TERTIARY: ['#242933', '#d8dee9'],
      BACKGROUND_BASE_LOW: ['#2e3440', '#eceff4'],
      BACKGROUND_BASE_LOWER: ['#3b4252', '#e5e9f0'],
      BACKGROUND_BASE_LOWEST: ['#242933', '#d8dee9'],
      BACKGROUND_SURFACE_HIGH: ['#434c5e', '#ffffff'],
      TEXT_NORMAL: ['#eceff4', '#2e3440'],
      TEXT_MUTED: ['#a5b1c2', '#4c566a'],
      HEADER_PRIMARY: ['#ffffff', '#2e3440'],
      BRAND_500: ['#88c0d0', '#5e81ac'],
    },
    rawColors: buildDarkRawRamp('#2e3440', '#3b4252', '#242933', '#434c5e', '#88c0d0'),
  },
  {
    id: 'sakura-cream',
    name: 'Sakura Cream',
    description: 'Soft golden cream and blossom pink theme inspired by sunny desks.',
    authors: ['flufstails'],
    spec: 2,
    builtin: true,
    baseMode: 'light',
    preview: ['#fdf6ec', '#f6e8d7', '#e07a9c'],
    semanticColors: {
      BACKGROUND_PRIMARY: ['#2b2220', '#fdf6ec'],
      BACKGROUND_SECONDARY: ['#241c1a', '#f6e8d7'],
      BACKGROUND_TERTIARY: ['#1c1513', '#edd8c2'],
      BACKGROUND_MOBILE_PRIMARY: ['#2b2220', '#fdf6ec'],
      BACKGROUND_MOBILE_SECONDARY: ['#241c1a', '#f6e8d7'],
      CHAT_BACKGROUND: ['#2b2220', '#fdf6ec'],
      CARD_PRIMARY_BG: ['#352a27', '#fffaf2'],
      BG_BASE_PRIMARY: ['#2b2220', '#fdf6ec'],
      BG_BASE_SECONDARY: ['#241c1a', '#f6e8d7'],
      BG_BASE_TERTIARY: ['#1c1513', '#edd8c2'],
      BACKGROUND_BASE_LOW: ['#2b2220', '#fdf6ec'],
      BACKGROUND_BASE_LOWER: ['#241c1a', '#f6e8d7'],
      BACKGROUND_BASE_LOWEST: ['#1c1513', '#edd8c2'],
      BACKGROUND_SURFACE_HIGH: ['#352a27', '#fffaf2'],
      TEXT_NORMAL: ['#f9efe6', '#3d2c28'],
      TEXT_MUTED: ['#b89f97', '#7b615a'],
      HEADER_PRIMARY: ['#fff4ea', '#2c1d19'],
      BRAND_500: ['#e07a9c', '#d9648a'],
    },
    rawColors: buildLightRawRamp(
      '#fdf6ec',
      '#f6e8d7',
      '#edd8c2',
      '#2b2220',
      '#241c1a',
      '#1c1513',
      '#e07a9c',
    ),
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    description: 'Deep indigo storm backdrop with neon sky-blue accents.',
    authors: ['flufstails'],
    spec: 2,
    builtin: true,
    baseMode: 'dark',
    preview: ['#1a1b26', '#16161e', '#7aa2f7'],
    semanticColors: {
      BACKGROUND_PRIMARY: ['#1a1b26', '#d5d6db'],
      BACKGROUND_SECONDARY: ['#16161e', '#cbccd1'],
      BACKGROUND_TERTIARY: ['#12121a', '#c0c1c7'],
      BACKGROUND_MOBILE_PRIMARY: ['#1a1b26', '#d5d6db'],
      BACKGROUND_MOBILE_SECONDARY: ['#16161e', '#cbccd1'],
      CHAT_BACKGROUND: ['#1a1b26', '#d5d6db'],
      CARD_PRIMARY_BG: ['#24283b', '#e6e7ec'],
      BG_BASE_PRIMARY: ['#1a1b26', '#d5d6db'],
      BG_BASE_SECONDARY: ['#16161e', '#cbccd1'],
      BG_BASE_TERTIARY: ['#12121a', '#c0c1c7'],
      BACKGROUND_BASE_LOW: ['#1a1b26', '#d5d6db'],
      BACKGROUND_BASE_LOWER: ['#16161e', '#cbccd1'],
      BACKGROUND_BASE_LOWEST: ['#12121a', '#c0c1c7'],
      BACKGROUND_SURFACE_HIGH: ['#24283b', '#e6e7ec'],
      TEXT_NORMAL: ['#c0caf5', '#343b58'],
      TEXT_MUTED: ['#787c99', '#565a6e'],
      HEADER_PRIMARY: ['#e0e6ff', '#1f2335'],
      BRAND_500: ['#7aa2f7', '#3d59a1'],
    },
    rawColors: buildDarkRawRamp('#1a1b26', '#16161e', '#12121a', '#24283b', '#7aa2f7'),
  },
];

let initialized = false;
const cleanups: Array<() => void> = [];
const patchedResolvers = new WeakMap<object, Set<string>>();
const loggedSampleKeys = new Set<string>();
const rawTargets = new Set<object>();
const rawSnapshots = new Map<
  object,
  Map<string, { hadOwn: boolean; descriptor?: PropertyDescriptor }>
>();

function extractTokenKey(token: unknown): string | null {
  if (typeof token === 'string') {
    return token;
  }
  if (typeof token === 'symbol') {
    const keyed = Symbol.keyFor(token);
    if (keyed) return keyed;
    if (typeof token.description === 'string' && token.description.length > 0) {
      return token.description;
    }
    const raw = String(token);
    const match = /^Symbol\((.+)\)$/.exec(raw);
    return match ? match[1] : null;
  }
  if (token && typeof token === 'object') {
    const obj = token as Record<string, any>;
    if (typeof obj.key === 'string') return obj.key;
    if (typeof obj.name === 'string') return obj.name;
    if (typeof obj.raw === 'string') return obj.raw;
    if (obj.semanticColor != null) return extractTokenKey(obj.semanticColor);
    if (obj.symbol) return extractTokenKey(obj.symbol);
  }
  return null;
}

function resolveColorEntry(
  entry: Array<string | null> | string | undefined,
  discordTheme: string,
): string | null {
  if (!entry) {
    return null;
  }
  if (typeof entry === 'string') {
    return entry.trim() || null;
  }
  if (Array.isArray(entry)) {
    const isLight = discordTheme === 'light';
    const picked = isLight ? entry[1] ?? entry[0] : entry[0] ?? entry[1];
    return typeof picked === 'string' && picked.trim() ? picked.trim() : null;
  }
  return null;
}

function normalizeTokenKey(tokenKey: string): string {
  return tokenKey
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function lookupSemanticTokenColor(
  theme: NekocordTheme,
  tokenKey: string,
  discordTheme: string,
): string | null {
  const map = theme.semanticColors;
  if (!map) {
    return null;
  }
  const normalizedKey = normalizeTokenKey(tokenKey);
  if (
    !normalizedKey ||
    normalizedKey === 'TRANSPARENT' ||
    normalizedKey === 'BLACK' ||
    normalizedKey === 'WHITE'
  ) {
    return null;
  }

  const direct =
    resolveColorEntry(map[tokenKey], discordTheme) ??
    (normalizedKey !== tokenKey ? resolveColorEntry(map[normalizedKey], discordTheme) : null);
  if (direct) {
    return direct;
  }

  const aliases = TOKEN_ALIASES[tokenKey] ?? TOKEN_ALIASES[normalizedKey];
  if (aliases) {
    for (let i = 0; i < aliases.length; i += 1) {
      const hit = resolveColorEntry(map[aliases[i]], discordTheme);
      if (hit) {
        return hit;
      }
    }
  }

  if (
    normalizedKey.startsWith('BACKGROUND_BASE_LOWEST') ||
    normalizedKey.startsWith('BG_BASE_TERTIARY')
  ) {
    return resolveColorEntry(map.BACKGROUND_TERTIARY ?? map.BG_BASE_TERTIARY, discordTheme);
  }
  if (
    normalizedKey.startsWith('BACKGROUND_BASE_LOWER') ||
    normalizedKey.startsWith('BG_BASE_SECONDARY') ||
    normalizedKey.startsWith('BACKGROUND_SECONDARY')
  ) {
    return resolveColorEntry(map.BACKGROUND_SECONDARY ?? map.BG_BASE_SECONDARY, discordTheme);
  }
  if (
    normalizedKey.startsWith('BACKGROUND_BASE_LOW') ||
    normalizedKey.startsWith('BG_BASE_PRIMARY') ||
    normalizedKey.startsWith('BACKGROUND_PRIMARY') ||
    normalizedKey.startsWith('CHAT_BACKGROUND')
  ) {
    return resolveColorEntry(map.BACKGROUND_PRIMARY ?? map.BG_BASE_PRIMARY, discordTheme);
  }
  if (
    normalizedKey.startsWith('BACKGROUND_SURFACE_') ||
    normalizedKey.startsWith('BG_SURFACE_') ||
    normalizedKey.startsWith('BACKGROUND_MOD_') ||
    (normalizedKey.startsWith('CARD_') && normalizedKey.endsWith('_BG'))
  ) {
    return resolveColorEntry(map.CARD_PRIMARY_BG ?? map.BACKGROUND_SURFACE_HIGH, discordTheme);
  }

  return null;
}

function lookupSemanticCached(
  theme: NekocordTheme,
  tokenKey: string,
  discordTheme: string,
): string | null {
  const cacheKey = `${discordTheme}\0${tokenKey}`;
  const cached = semanticLookupCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  const computed = lookupSemanticTokenColor(theme, tokenKey, discordTheme);
  if (semanticLookupCache.size > 4096) {
    semanticLookupCache.clear();
  }
  semanticLookupCache.set(cacheKey, computed);
  return computed;
}

function lookupRawFallbackCached(theme: NekocordTheme, tokenKey: string): string | null {
  const cached = rawLookupCache.get(tokenKey);
  if (cached !== undefined) {
    return cached;
  }
  const rawMap = computeEffectiveRawColors(theme);
  let val: string | undefined = rawMap[tokenKey];
  if (val === undefined) {
    const normalizedKey = normalizeTokenKey(tokenKey);
    val = normalizedKey ? rawMap[normalizedKey] : undefined;
  }
  const clean = typeof val === 'string' && val.trim() ? val.trim() : null;
  if (rawLookupCache.size > 2048) {
    rawLookupCache.clear();
  }
  rawLookupCache.set(tokenKey, clean);
  return clean;
}

function markResolverPatched(target: any, key: string): boolean {
  if (!target || typeof target[key] !== 'function') {
    return false;
  }
  let keys = patchedResolvers.get(target);
  if (!keys) {
    keys = new Set<string>();
    patchedResolvers.set(target, keys);
  }
  if (keys.has(key)) {
    return false;
  }
  keys.add(key);
  return true;
}

function logSampleTokenKey(tokenKey: string): void {
  if (loggedSampleKeys.size < 5 && !loggedSampleKeys.has(tokenKey)) {
    loggedSampleKeys.add(tokenKey);
    console.log(`[Nekocord/Themes] Resolved sample token: ${tokenKey}`);
  }
}

const THEME_NAME_PREFIX_RE = /^(dark|darker|midnight|light|amoled|ash|onyx)$/i;

function hookResolverTarget(target: any, key: string, label?: string): void {
  if (!markResolverPatched(target, key)) {
    return;
  }
  const hookLabel = label ?? key;
  try {
    const u: Unpatch = instead(target, key, (args: any[], orig: (...a: any[]) => any) => {
      const theme = getActiveTheme();
      if (theme && theme.semanticColors) {
        const arg0 = args[0];
        const firstIsTheme = typeof arg0 === 'string' && THEME_NAME_PREFIX_RE.test(arg0);
        const discordTheme = firstIsTheme
          ? arg0
          : String(getThemeStore<{ theme?: string }>()?.theme ?? 'dark');
        const tokenArg = firstIsTheme ? args[1] : (args[1] ?? arg0);
        const tokenKey = extractTokenKey(tokenArg);
        if (tokenKey) {
          logSampleTokenKey(tokenKey);
          const override = lookupSemanticCached(theme, tokenKey, discordTheme);
          if (override) {
            return override;
          }
        }
      }
      return orig(...args);
    });
    cleanups.push(u);
    console.log(`[Nekocord/Themes] Hooked ${hookLabel}`);
  } catch (err) {
    console.error(`[Nekocord/Themes] Failed to hook ${hookLabel}:`, err);
  }
}

function hookRawColorGetter(target: any, key: string): void {
  if (!markResolverPatched(target, key)) {
    return;
  }
  try {
    const u: Unpatch = instead(target, key, (args: any[], orig: (...a: any[]) => any) => {
      const theme = getActiveTheme();
      const rawKey = args[0] != null ? String(args[0]) : '';
      const rawMap = theme ? computeEffectiveRawColors(theme) : null;
      const override = rawKey && rawMap ? rawMap[rawKey] : undefined;
      if (typeof override === 'string' && override.trim()) {
        return override.trim();
      }
      return orig(...args);
    });
    cleanups.push(u);
    console.log(`[Nekocord/Themes] Hooked ${key}`);
  } catch (err) {
    console.error(`[Nekocord/Themes] Failed to hook ${key}:`, err);
  }
}

function hookUseToken(target: any, key: string): void {
  if (!markResolverPatched(target, key)) {
    return;
  }
  try {
    // React hooks must execute the underlying call before overriding so hook counts never shift.
    const u: Unpatch = after(target, key, (args: any[], res: any) => {
      if (typeof res !== 'string' && res != null) {
        return res;
      }
      const theme = getActiveTheme();
      if (!theme) {
        return res;
      }
      const tokenKey = extractTokenKey(args[0]);
      if (!tokenKey) {
        return res;
      }
      logSampleTokenKey(tokenKey);
      const discordTheme = String(getThemeStore<{ theme?: string }>()?.theme ?? 'dark');
      const semanticOverride = lookupSemanticCached(theme, tokenKey, discordTheme);
      if (semanticOverride) {
        return semanticOverride;
      }
      const rawOverride = lookupRawFallbackCached(theme, tokenKey);
      return rawOverride ?? res;
    });
    cleanups.push(u);
    console.log(`[Nekocord/Themes] Hooked ${key}`);
  } catch (err) {
    console.error(`[Nekocord/Themes] Failed to hook ${key}:`, err);
  }
}

function restoreRawOverrides(): void {
  rawSnapshots.forEach((propMap, target) => {
    propMap.forEach((snap, key) => {
      try {
        if (snap.hadOwn && snap.descriptor) {
          Object.defineProperty(target, key, snap.descriptor);
        } else {
          delete (target as Record<string, any>)[key];
        }
      } catch {
        // Ignore frozen raw color objects.
      }
    });
    propMap.clear();
  });
}

function applyRawToObject(
  obj: Record<string, any>,
  rawColors: Record<string, string>,
): { written: number; skipped: number } {
  let written = 0;
  let skipped = 0;
  if (!obj || typeof obj !== 'object') {
    return { written, skipped };
  }
  let snapMap = rawSnapshots.get(obj);
  if (!snapMap) {
    snapMap = new Map();
    rawSnapshots.set(obj, snapMap);
  }

  for (const [key, value] of Object.entries(rawColors)) {
    if (typeof value !== 'string' || !value.trim()) {
      continue;
    }
    try {
      const hasOwn = Object.prototype.hasOwnProperty.call(obj, key);
      if (!snapMap.has(key)) {
        snapMap.set(key, {
          hadOwn: hasOwn,
          descriptor: hasOwn ? Object.getOwnPropertyDescriptor(obj, key) : undefined,
        });
      }
      const currentDesc = Object.getOwnPropertyDescriptor(obj, key);
      if (!currentDesc || currentDesc.configurable || currentDesc.writable) {
        if (currentDesc && !currentDesc.writable && currentDesc.configurable) {
          Object.defineProperty(obj, key, {
            configurable: true,
            enumerable: currentDesc.enumerable ?? true,
            writable: true,
            value,
          });
        } else {
          obj[key] = value;
        }
        if (obj[key] === value) {
          written += 1;
        } else {
          skipped += 1;
        }
      } else {
        skipped += 1;
      }
    } catch {
      skipped += 1;
    }
  }
  return { written, skipped };
}

function registerRawTarget(mod: any): void {
  if (!mod || typeof mod !== 'object') {
    return;
  }
  const targets = [
    mod.unsafe_rawColors,
    mod.rawColors,
    mod.default?.unsafe_rawColors,
    mod.default?.rawColors,
    ('PRIMARY_600' in mod && 'WHITE_500' in mod) || ('PLUM_20' in mod && 'PRIMARY_600' in mod)
      ? mod
      : null,
  ];
  let added = false;
  for (let i = 0; i < targets.length; i += 1) {
    const t = targets[i];
    if (t && typeof t === 'object' && !rawTargets.has(t)) {
      rawTargets.add(t);
      added = true;
      try {
        const allKeys = Object.keys(t);
        const samples = allKeys
          .filter((k) => /^(PRIMARY_600|PLUM_20|NEUTRAL_73|NEUTRAL_79|NEUTRAL_80|BRAND_500)$/.test(k))
          .slice(0, 6);
        console.log(
          `[Nekocord/Themes] Registered raw color map (keys=${allKeys.length}, samples=${samples.join(',')})`,
        );
      } catch {
        // Ignore key counting errors on proxies.
      }
    }
  }
  if (added) {
    applyActiveTheme();
  }
}

let loggedSemanticHostKeys = false;

function inspectThemeModule(mod: any): void {
  if (!mod || (typeof mod !== 'object' && typeof mod !== 'function')) {
    return;
  }
  try {
    let hookedResolver = false;
    if (typeof mod.resolveSemanticColor === 'function') {
      hookResolverTarget(mod, 'resolveSemanticColor');
      hookedResolver = true;
    }
    if (typeof mod.default?.resolveSemanticColor === 'function') {
      hookResolverTarget(mod.default, 'resolveSemanticColor', 'default.resolveSemanticColor');
      hookedResolver = true;
    }
    if (typeof mod.meta?.resolveSemanticColor === 'function') {
      hookResolverTarget(mod.meta, 'resolveSemanticColor', 'meta.resolveSemanticColor');
      hookedResolver = true;
    }
    if (typeof mod.default?.meta?.resolveSemanticColor === 'function') {
      hookResolverTarget(mod.default.meta, 'resolveSemanticColor', 'meta.resolveSemanticColor');
      hookedResolver = true;
    }
    if (typeof mod.internal?.resolveSemanticColor === 'function') {
      hookResolverTarget(mod.internal, 'resolveSemanticColor', 'internal.resolveSemanticColor');
      hookedResolver = true;
    }
    if (typeof mod.default?.internal?.resolveSemanticColor === 'function') {
      hookResolverTarget(
        mod.default.internal,
        'resolveSemanticColor',
        'internal.resolveSemanticColor',
      );
      hookedResolver = true;
    }
    if (typeof mod.colors?.resolveSemanticColor === 'function') {
      hookResolverTarget(mod.colors, 'resolveSemanticColor', 'colors.resolveSemanticColor');
      hookedResolver = true;
    }
    if (typeof mod.SemanticColor?.resolveSemanticColor === 'function') {
      hookResolverTarget(
        mod.SemanticColor,
        'resolveSemanticColor',
        'SemanticColor.resolveSemanticColor',
      );
      hookedResolver = true;
    }

    if (!hookedResolver && !loggedSemanticHostKeys && typeof mod.isSemanticColor === 'function') {
      loggedSemanticHostKeys = true;
      try {
        console.log(
          `[Nekocord/Themes] isSemanticColor module keys: ${Object.keys(mod).slice(0, 16).join(',')}`,
        );
      } catch {
        // Ignore key inspection errors.
      }
    }

    if (typeof mod.unsafe_getRawColor === 'function') {
      hookRawColorGetter(mod, 'unsafe_getRawColor');
    }
    if (typeof mod.default?.unsafe_getRawColor === 'function') {
      hookRawColorGetter(mod.default, 'unsafe_getRawColor');
    }
    if (typeof mod.useToken === 'function') {
      hookUseToken(mod, 'useToken');
    }
    if (typeof mod.default?.useToken === 'function') {
      hookUseToken(mod.default, 'useToken');
    }
    registerRawTarget(mod);
  } catch {
    // Ignore hostile module proxies during inspection.
  }
}

function isThemeRelevantModule(m: any): boolean {
  if (typeof m !== 'object' || m === null) {
    return false;
  }
  return (
    typeof m.resolveSemanticColor === 'function' ||
    typeof m.default?.resolveSemanticColor === 'function' ||
    typeof m.meta?.resolveSemanticColor === 'function' ||
    typeof m.internal?.resolveSemanticColor === 'function' ||
    typeof m.colors?.resolveSemanticColor === 'function' ||
    typeof m.SemanticColor?.resolveSemanticColor === 'function' ||
    typeof m.default?.meta?.resolveSemanticColor === 'function' ||
    typeof m.default?.internal?.resolveSemanticColor === 'function' ||
    typeof m.isSemanticColor === 'function' ||
    typeof m.unsafe_getRawColor === 'function' ||
    typeof m.default?.unsafe_getRawColor === 'function' ||
    typeof m.useToken === 'function' ||
    typeof m.default?.useToken === 'function' ||
    'unsafe_rawColors' in m ||
    'rawColors' in m ||
    ('PRIMARY_600' in m && 'WHITE_500' in m) ||
    ('PLUM_20' in m && 'PRIMARY_600' in m)
  );
}

/**
 * Returns every built-in and user-installed theme.
 */
export function getAllThemes(): NekocordTheme[] {
  return [...BUILTIN_THEMES, ...getCustomThemes()];
}

/**
 * Returns the currently selected theme object, or null when using stock Discord styling.
 */
export function getActiveTheme(): NekocordTheme | null {
  const id = getActiveThemeId();
  if (cachedActiveThemeId !== undefined && cachedActiveThemeId === id) {
    return cachedActiveThemeObj;
  }
  cachedActiveThemeId = id;
  if (!id) {
    cachedActiveThemeObj = null;
    return null;
  }
  const found =
    BUILTIN_THEMES.find((t) => t.id === id) ??
    getCustomThemes().find((t) => t.id === id) ??
    null;
  cachedActiveThemeObj = found;
  return found;
}

/**
 * Applies raw color overrides for the currently active theme (or restores stock colors).
 */
export function applyActiveTheme(): void {
  invalidateThemeCache();
  restoreRawOverrides();
  const theme = getActiveTheme();
  if (!theme) {
    return;
  }
  const effectiveRaw = computeEffectiveRawColors(theme);
  if (Object.keys(effectiveRaw).length === 0) {
    return;
  }
  let totalWritten = 0;
  let totalSkipped = 0;
  rawTargets.forEach((target) => {
    const counts = applyRawToObject(target as Record<string, any>, effectiveRaw);
    totalWritten += counts.written;
    totalSkipped += counts.skipped;
  });
  if (rawTargets.size > 0) {
    console.log(
      `[Nekocord/Themes] Applied raw colors (written=${totalWritten}, skipped=${totalSkipped})`,
    );
  }
}

/**
 * Selects a theme by ID (or null for default) and updates runtime overrides.
 */
export function selectTheme(id: string | null): NekocordTheme | null {
  invalidateThemeCache();
  setActiveThemeId(id);
  applyActiveTheme();
  const chosen = getActiveTheme();
  console.log(`[Nekocord/Themes] Selected theme: ${chosen ? chosen.name : 'Default Discord'}`);
  return chosen;
}

/**
 * Removes a user-installed custom theme by ID.
 */
export function deleteCustomTheme(id: string): void {
  invalidateThemeCache();
  const wasActive = getActiveThemeId() === id;
  removeCustomTheme(id);
  if (wasActive) {
    applyActiveTheme();
  }
}

function slugifyThemeId(name: string): string {
  const clean = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return clean
    ? `custom-${clean}-${Date.now().toString(36).slice(-4)}`
    : `custom-${Date.now().toString(36)}`;
}

function collectPreviewSwatches(
  semantic?: Record<string, Array<string | null> | string>,
  raw?: Record<string, string>,
): string[] {
  const picks: string[] = [];
  const check = (val: unknown) => {
    if (typeof val === 'string' && val.startsWith('#') && !picks.includes(val)) {
      picks.push(val);
    } else if (Array.isArray(val) && typeof val[0] === 'string' && !picks.includes(val[0])) {
      picks.push(val[0]);
    }
  };
  if (semantic) {
    check(semantic.BACKGROUND_PRIMARY ?? semantic.BG_BASE_PRIMARY ?? semantic.CHAT_BACKGROUND);
    check(semantic.BACKGROUND_SECONDARY ?? semantic.BG_BASE_SECONDARY ?? semantic.CARD_PRIMARY_BG);
    check(semantic.BRAND_500 ?? semantic.BG_BRAND ?? semantic.HEADER_PRIMARY);
    for (const v of Object.values(semantic)) {
      if (picks.length >= 3) break;
      check(v);
    }
  }
  if (raw) {
    check(raw.PRIMARY_600);
    check(raw.PRIMARY_630);
    check(raw.BRAND_500);
    for (const v of Object.values(raw)) {
      if (picks.length >= 3) break;
      check(v);
    }
  }
  return picks.length > 0 ? picks.slice(0, 3) : ['#1e1e2e', '#181825', '#5865f2'];
}

/**
 * Downloads, validates, and saves a Vendetta/Bunny-compatible theme JSON from an HTTPS URL.
 */
export async function installThemeFromUrl(
  rawUrl: string,
): Promise<{ ok: boolean; theme?: NekocordTheme; error?: string }> {
  const url = rawUrl.trim();
  if (!/^https?:\/\/\S+$/i.test(url)) {
    return { ok: false, error: 'Enter a valid http:// or https:// theme JSON URL.' };
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
    const parsed = (await res.json()) as Record<string, any>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.name !== 'string' || !parsed.name.trim()) {
      return { ok: false, error: 'Invalid theme JSON: missing "name" field.' };
    }

    const semanticColors =
      parsed.semanticColors && typeof parsed.semanticColors === 'object'
        ? (parsed.semanticColors as Record<string, Array<string | null> | string>)
        : undefined;
    const rawColors =
      parsed.rawColors && typeof parsed.rawColors === 'object'
        ? (parsed.rawColors as Record<string, string>)
        : undefined;

    if (!semanticColors && !rawColors) {
      return {
        ok: false,
        error: 'Theme JSON does not define any semanticColors or rawColors.',
      };
    }

    const authorsRaw = Array.isArray(parsed.authors)
      ? parsed.authors
          .map((a: any) => (typeof a === 'string' ? a : a?.name))
          .filter((a: any): a is string => typeof a === 'string' && a.trim().length > 0)
      : [];

    const existing = getCustomThemes().find((t) => t.sourceUrl === url);
    const theme: NekocordTheme = {
      id: existing?.id ?? slugifyThemeId(parsed.name),
      name: parsed.name.trim(),
      description:
        typeof parsed.description === 'string' && parsed.description.trim()
          ? parsed.description.trim()
          : 'Installed custom theme.',
      authors: authorsRaw.length > 0 ? authorsRaw : ['Custom'],
      spec: typeof parsed.spec === 'number' ? parsed.spec : 2,
      sourceUrl: url,
      preview: collectPreviewSwatches(semanticColors, rawColors),
      semanticColors,
      rawColors,
    };

    invalidateThemeCache();
    addCustomTheme(theme);
    return { ok: true, theme };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to parse theme JSON.',
    };
  }
}

/**
 * Derives Nekocord UI palette overrides from the currently selected theme for instant feedback.
 */
export function getActiveThemeUiPalette(isLight: boolean): NekocordUiThemeOverrides | null {
  const theme = getActiveTheme();
  if (!theme) {
    return null;
  }
  const discordMode = isLight ? 'light' : 'dark';
  const canvas =
    lookupSemanticCached(theme, 'BACKGROUND_PRIMARY', discordMode) ??
    theme.rawColors?.PRIMARY_600 ??
    undefined;
  const surface =
    lookupSemanticCached(theme, 'BACKGROUND_SECONDARY', discordMode) ??
    theme.rawColors?.PRIMARY_630 ??
    undefined;
  const surfaceAlt =
    lookupSemanticCached(theme, 'BACKGROUND_TERTIARY', discordMode) ??
    theme.rawColors?.PRIMARY_660 ??
    undefined;
  const surfaceHighlight =
    lookupSemanticCached(theme, 'CARD_PRIMARY_BG', discordMode) ??
    theme.rawColors?.PRIMARY_700 ??
    undefined;
  const textPrimary = lookupSemanticCached(theme, 'HEADER_PRIMARY', discordMode) ?? undefined;
  const textSecondary = lookupSemanticCached(theme, 'TEXT_NORMAL', discordMode) ?? undefined;
  const textMuted = lookupSemanticCached(theme, 'TEXT_MUTED', discordMode) ?? undefined;
  const brand =
    lookupSemanticCached(theme, 'BRAND_500', discordMode) ??
    theme.rawColors?.BRAND_500 ??
    undefined;

  return {
    ...(canvas ? { canvas, headerBg: canvas } : {}),
    ...(surface ? { surface } : {}),
    ...(surfaceAlt ? { surfaceAlt } : {}),
    ...(surfaceHighlight ? { surfaceHighlight } : {}),
    ...(textPrimary ? { textPrimary } : {}),
    ...(textSecondary ? { textSecondary } : {}),
    ...(textMuted ? { textMuted } : {}),
    ...(brand ? { brand } : {}),
  };
}

/**
 * Installs Discord semanticColor + rawColors hooks and applies any persisted theme.
 */
export function initThemeEngine(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  cleanups.push(
    subscribeSettings(() => {
      invalidateThemeCache();
    }),
  );

  cleanups.push(
    watchNamedExports(
      new Set(['resolveSemanticColor', 'unsafe_getRawColor', 'useToken', 'isSemanticColor']),
      (hit: ComponentPatchTarget) => {
        if (hit.matchedName === 'resolveSemanticColor') {
          hookResolverTarget(hit.target, hit.key);
        } else if (hit.matchedName === 'unsafe_getRawColor') {
          hookRawColorGetter(hit.target, hit.key);
        } else if (hit.matchedName === 'useToken') {
          hookUseToken(hit.target, hit.key);
        } else if (hit.matchedName === 'isSemanticColor') {
          inspectThemeModule(hit.target);
        }
      },
    ),
  );

  const probeGroups: string[][] = [
    ['unsafe_rawColors'],
    ['meta', 'colors'],
    ['internal', 'colors'],
    ['resolveSemanticColor'],
    ['isSemanticColor'],
    ['unsafe_getRawColor'],
    ['useToken'],
    ['PRIMARY_600', 'WHITE_500'],
    ['PLUM_20', 'PRIMARY_600'],
  ];
  for (let i = 0; i < probeGroups.length; i += 1) {
    const hit = findByProps(...probeGroups[i]);
    if (hit) {
      inspectThemeModule(hit);
    }
  }

  for (const hit of getModules(isThemeRelevantModule)) {
    inspectThemeModule(hit);
  }
  cleanups.push(waitFor(isThemeRelevantModule, inspectThemeModule));

  applyActiveTheme();
}
