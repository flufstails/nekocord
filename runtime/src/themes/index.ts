import {
  type ComponentPatchTarget,
  findByProps,
  getModules,
  waitFor,
  watchNamedExports,
} from '../metro/index.js';
import { getThemeStore } from '../metro/common.js';
import { pushNotification } from '../notifications/index.js';
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

export const BUILTIN_THEMES: NekocordTheme[] = [];

export const CUSTOM_CSS_TEMPLATE = `/**
 * @name Cozy Cream Dusk
 * @author flufstails
 * @description Soft midnight plum surfaces with golden-cream accents.
 */
:root {
  --background-primary: #1a1826;
  --background-secondary: #14121d;
  --background-tertiary: #0f0e17;
  --card-primary-bg: #232034;
  --text-normal: #f4eee6;
  --text-muted: #9e96b3;
  --header-primary: #fff8ef;
  --brand-500: #d982b5;
}`;

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

const CSS_COLOR_VALUE_RE =
  /^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\([^)]+\)|hsla?\([^)]+\)|black|white|transparent)$/i;

const CSS_VAR_TO_SEMANTIC: Record<string, string[]> = {
  'background-primary': ['BACKGROUND_PRIMARY', 'BG_BASE_PRIMARY', 'CHAT_BACKGROUND', 'BACKGROUND_MOBILE_PRIMARY', 'BACKGROUND_BASE_LOW'],
  'bg-base-primary': ['BACKGROUND_PRIMARY', 'BG_BASE_PRIMARY', 'CHAT_BACKGROUND', 'BACKGROUND_BASE_LOW'],
  'bg-primary': ['BACKGROUND_PRIMARY', 'BG_BASE_PRIMARY', 'CHAT_BACKGROUND'],
  'background-secondary': ['BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY', 'BACKGROUND_MOBILE_SECONDARY', 'BACKGROUND_BASE_LOWER'],
  'background-secondary-alt': ['BACKGROUND_SECONDARY_ALT', 'BACKGROUND_TERTIARY', 'CARD_PRIMARY_BG'],
  'bg-base-secondary': ['BACKGROUND_SECONDARY', 'BG_BASE_SECONDARY', 'BACKGROUND_BASE_LOWER'],
  'background-tertiary': ['BACKGROUND_TERTIARY', 'BG_BASE_TERTIARY', 'BACKGROUND_BASE_LOWEST'],
  'bg-base-tertiary': ['BACKGROUND_TERTIARY', 'BG_BASE_TERTIARY', 'BACKGROUND_BASE_LOWEST'],
  'background-mobile-primary': ['BACKGROUND_MOBILE_PRIMARY', 'BACKGROUND_PRIMARY'],
  'background-mobile-secondary': ['BACKGROUND_MOBILE_SECONDARY', 'BACKGROUND_SECONDARY'],
  'chat-background': ['CHAT_BACKGROUND', 'BACKGROUND_PRIMARY'],
  'bg-overlay-chat': ['CHAT_BACKGROUND', 'BACKGROUND_PRIMARY'],
  'bg-overlay-app-frame': ['BACKGROUND_TERTIARY', 'BG_BASE_TERTIARY'],
  'background-floating': ['BACKGROUND_FLOATING', 'CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH'],
  'card-primary-bg': ['CARD_PRIMARY_BG', 'BACKGROUND_SURFACE_HIGH'],
  'background-surface-high': ['BACKGROUND_SURFACE_HIGH', 'CARD_PRIMARY_BG'],
  'background-accent': ['BACKGROUND_MOD_STRONG', 'CARD_PRIMARY_BG'],
  'background-modifier-hover': ['BACKGROUND_MOD_SUBTLE', 'BACKGROUND_SURFACE_HIGH'],
  'background-modifier-active': ['BACKGROUND_MOD_MUTED', 'BACKGROUND_SURFACE_HIGH'],
  'background-modifier-selected': ['BACKGROUND_MOD_NORMAL', 'BACKGROUND_SURFACE_HIGH'],
  'channeltextarea-background': ['BACKGROUND_SECONDARY_ALT', 'CARD_SECONDARY_BG', 'BACKGROUND_TERTIARY'],
  'channels-default': ['CHANNEL_ICON', 'INTERACTIVE_NORMAL', 'TEXT_MUTED'],
  'text-normal': ['TEXT_NORMAL', 'TEXT_DEFAULT', 'TEXT_PRIMARY'],
  'text-default': ['TEXT_DEFAULT', 'TEXT_NORMAL', 'TEXT_PRIMARY'],
  'text-muted': ['TEXT_MUTED', 'TEXT_SUBTLE', 'TEXT_SECONDARY'],
  'text-subtle': ['TEXT_SUBTLE', 'TEXT_MUTED'],
  'header-primary': ['HEADER_PRIMARY', 'TEXT_STRONG'],
  'header-secondary': ['HEADER_SECONDARY', 'TEXT_MUTED'],
  'brand-500': ['BRAND_500', 'BG_BRAND', 'BACKGROUND_BRAND'],
  'brand-experiment': ['BRAND_500', 'BG_BRAND', 'BACKGROUND_BRAND'],
  'brand-experiment-500': ['BRAND_500', 'BG_BRAND', 'BACKGROUND_BRAND'],
  'brand-experiment-560': ['BRAND_500', 'BG_BRAND', 'BACKGROUND_BRAND'],
  'accent-color': ['BRAND_500', 'BG_BRAND'],
  'control-brand-foreground': ['CONTROL_BRAND_FOREGROUND', 'BRAND_500'],
  'interactive-normal': ['INTERACTIVE_NORMAL', 'ICON_MUTED'],
  'interactive-active': ['INTERACTIVE_ACTIVE', 'ICON_STRONG'],
};

function resolveCssColorVar(
  rawVal: string,
  varMap: Record<string, string>,
  depth = 0,
): string | null {
  if (depth > 6 || !rawVal) {
    return null;
  }
  const cleaned = rawVal.replace(/\s*!important\s*$/i, '').trim();
  if (CSS_COLOR_VALUE_RE.test(cleaned)) {
    return cleaned;
  }
  const varMatch = /^var\(\s*--([a-z0-9_-]+)(?:\s*,\s*([^)]+))?\s*\)$/i.exec(cleaned);
  if (!varMatch) {
    return null;
  }
  const refName = varMatch[1].toLowerCase();
  if (varMap[refName]) {
    const resolved = resolveCssColorVar(varMap[refName], varMap, depth + 1);
    if (resolved) return resolved;
  }
  if (varMatch[2]) {
    return resolveCssColorVar(varMatch[2], varMap, depth + 1);
  }
  return null;
}

function collectCssDeclsFromBlocks(
  cssText: string,
  targetSelectorFilter: 'light' | 'general',
): Record<string, string> {
  const vars: Record<string, string> = {};
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  let blockMatch: RegExpExecArray | null;

  while ((blockMatch = blockRe.exec(withoutComments)) !== null) {
    const selector = blockMatch[1].trim().toLowerCase();
    const isLightBlock = selector.indexOf('.theme-light') !== -1;
    if (targetSelectorFilter === 'light' && !isLightBlock) {
      continue;
    }
    if (targetSelectorFilter === 'general' && isLightBlock) {
      continue;
    }

    const body = blockMatch[2];
    const declRe = /--([a-z0-9_-]+)\s*:\s*([^;}\n]+)/gi;
    let declMatch: RegExpExecArray | null;
    while ((declMatch = declRe.exec(body)) !== null) {
      vars[declMatch[1].toLowerCase()] = declMatch[2].trim();
    }
  }

  return vars;
}

/**
 * Parses a custom CSS theme (BetterDiscord/Vencord/CSS variable declarations) into a {@link NekocordTheme}.
 */
export function parseCssTheme(
  cssText: string,
  options?: { name?: string; sourceUrl?: string },
): { ok: boolean; theme?: NekocordTheme; error?: string } {
  const rawCss = typeof cssText === 'string' ? cssText.trim() : '';
  if (!rawCss) {
    return { ok: false, error: 'Paste CSS variable rules or a valid CSS theme first.' };
  }

  const metaName = /@name\s+([^\r\n*]+)/i.exec(rawCss)?.[1]?.trim();
  const metaAuthor = /@author\s+([^\r\n*]+)/i.exec(rawCss)?.[1]?.trim();
  const metaDesc = /@description\s+([^\r\n*]+)/i.exec(rawCss)?.[1]?.trim();

  const generalVars = collectCssDeclsFromBlocks(rawCss, 'general');
  const lightVars = collectCssDeclsFromBlocks(rawCss, 'light');

  if (Object.keys(generalVars).length === 0 && Object.keys(lightVars).length === 0) {
    const fallbackDecls = /--([a-z0-9_-]+)\s*:\s*([^;}\n]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = fallbackDecls.exec(rawCss)) !== null) {
      generalVars[m[1].toLowerCase()] = m[2].trim();
    }
  }

  const mergedLookupVars = { ...lightVars, ...generalVars };
  const semanticColors: Record<string, Array<string | null> | string> = {};
  const rawColors: Record<string, string> = {};
  let colorCount = 0;

  const mapDeclSet = (declMap: Record<string, string>, slot: 0 | 1) => {
    for (const [varName, rawValue] of Object.entries(declMap)) {
      const color = resolveCssColorVar(rawValue, slot === 0 ? generalVars : mergedLookupVars);
      if (!color) continue;

      const semanticTargets = CSS_VAR_TO_SEMANTIC[varName];
      if (semanticTargets) {
        for (let i = 0; i < semanticTargets.length; i += 1) {
          const semKey = semanticTargets[i];
          const existing = Array.isArray(semanticColors[semKey])
            ? [...(semanticColors[semKey] as Array<string | null>)]
            : [null, null];
          existing[slot] = color;
          if (!existing[0]) existing[0] = color;
          if (!existing[1]) existing[1] = color;
          semanticColors[semKey] = existing;
          colorCount += 1;
        }
      } else {
        const normalizedKey = normalizeTokenKey(varName);
        if (/^(?:PRIMARY|PLUM|NEUTRAL|BRAND|WHITE|BLACK|GREEN|YELLOW|RED)_[0-9]+$/i.test(normalizedKey)) {
          rawColors[normalizedKey] = color;
          colorCount += 1;
        } else if (normalizedKey && /^(?:BACKGROUND|TEXT|HEADER|CARD|BG|BRAND|ACCENT)/.test(normalizedKey)) {
          const existing = Array.isArray(semanticColors[normalizedKey])
            ? [...(semanticColors[normalizedKey] as Array<string | null>)]
            : [color, color];
          existing[slot] = color;
          semanticColors[normalizedKey] = existing;
          colorCount += 1;
        }
      }
    }
  };

  mapDeclSet(generalVars, 0);
  if (Object.keys(lightVars).length > 0) {
    mapDeclSet(lightVars, 1);
  }

  if (colorCount === 0) {
    return {
      ok: false,
      error: 'No supported CSS color variables (e.g. --background-primary, --text-normal, --brand-500) found.',
    };
  }

  const resolvedName = options?.name?.trim() || metaName || 'Custom CSS Theme';
  const existing =
    (options?.sourceUrl
      ? getCustomThemes().find((t) => t.sourceUrl === options.sourceUrl)
      : undefined) ?? getCustomThemes().find((t) => t.name === resolvedName && t.kind === 'css');

  const theme: NekocordTheme = {
    id: existing?.id ?? slugifyThemeId(resolvedName),
    name: resolvedName,
    description: metaDesc || 'Custom CSS variable theme.',
    authors: metaAuthor ? [metaAuthor] : ['Custom CSS'],
    spec: 2,
    kind: 'css',
    customCss: rawCss,
    ...(options?.sourceUrl ? { sourceUrl: options.sourceUrl } : {}),
    baseMode: Object.keys(lightVars).length > 0 && Object.keys(generalVars).length === 0 ? 'light' : 'dark',
    preview: collectPreviewSwatches(semanticColors, rawColors),
    semanticColors,
    rawColors,
  };

  return { ok: true, theme };
}

/**
 * Compiles and saves a custom CSS theme locally, immediately invalidating cached tokens.
 */
export function installThemeFromCss(
  cssText: string,
  customName?: string,
  sourceUrl?: string,
): { ok: boolean; theme?: NekocordTheme; error?: string } {
  const parsed = parseCssTheme(cssText, { name: customName, sourceUrl });
  if (!parsed.ok || !parsed.theme) {
    return parsed;
  }
  invalidateThemeCache();
  addCustomTheme(parsed.theme);
  if (getActiveThemeId() === parsed.theme.id) {
    applyActiveTheme();
  }
  pushNotification({
    title: 'Custom CSS Theme Installed',
    body: `Saved "${parsed.theme.name}". Toggle it on and restart to apply.`,
    source: 'Themes',
    kind: 'success',
  });
  return { ok: true, theme: parsed.theme };
}

/**
 * Downloads, validates, and saves either a Vendetta/Bunny JSON theme or a custom `.css` theme URL.
 */
export async function installThemeFromUrl(
  rawUrl: string,
): Promise<{ ok: boolean; theme?: NekocordTheme; error?: string }> {
  const url = rawUrl.trim();
  if (!/^https?:\/\/\S+$/i.test(url)) {
    return { ok: false, error: 'Enter a valid http:// or https:// theme URL.' };
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
    const trimmed = typeof text === 'string' ? text.trim() : '';
    const looksCss =
      /\.css(?:\?|#|$)/i.test(url) || (trimmed.length > 0 && trimmed[0] !== '{' && trimmed[0] !== '[');

    if (looksCss) {
      return installThemeFromCss(trimmed, undefined, url);
    }

    const parsed = JSON.parse(trimmed) as Record<string, any>;
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
      kind: 'json',
      sourceUrl: url,
      preview: collectPreviewSwatches(semanticColors, rawColors),
      semanticColors,
      rawColors,
    };

    invalidateThemeCache();
    addCustomTheme(theme);
    if (getActiveThemeId() === theme.id) {
      applyActiveTheme();
    }
    pushNotification({
      title: 'Theme Installed',
      body: `Installed "${theme.name}" from URL.`,
      source: 'Themes',
      kind: 'success',
    });
    return { ok: true, theme };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to parse theme file.',
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
