import { getClipboardModule, getStore, restartDiscordApp } from '../metro/common.js';
import {
  clearNotificationLog,
  deleteNotification,
  getNotificationLog,
  pushNotification,
  subscribeNotifications,
  subscribeToasts,
  type NekocordNotificationEntry,
} from '../notifications/index.js';
import { EXAMPLE_CUSTOM_PLUGIN_CODE } from '../plugins/custom.js';
import { clearInlineMessageHistory } from '../plugins/messageLogger/index.js';
import {
  formatSettingLabel,
  hasVisiblePluginSettings,
  OptionType,
  type PluginSettingDef,
} from '../plugins/settings.js';
import {
  normalizePluginAuthors,
  type NekocordPlugin,
  type PluginAuthor,
} from '../plugins/types.js';
import {
  DEFAULT_UPDATE_SOURCE,
  exportSettingsJson,
  getActiveThemeId,
  getFavoritePlugins,
  getNotificationSettings,
  getUpdateSource,
  importSettingsJson,
  resetPluginSettings,
  resetSettings,
  setUpdateSource,
  subscribeSettings,
  toggleFavoritePlugin,
  updateNotificationSettings,
} from '../storage/index.js';
import {
  CUSTOM_CSS_TEMPLATE,
  deleteCustomTheme,
  getActiveTheme,
  getActiveThemeUiPalette,
  getAllThemes,
  installThemeFromCss,
  installThemeFromUrl,
  selectTheme,
  type NekocordTheme,
} from '../themes/index.js';
import {
  applyRuntimeUpdate,
  checkForUpdates,
  openReleasePage,
  type UpdateCheckResult,
} from '../updater/index.js';
import { NEKOCORD_LOGO_DATA_URI } from './NekocordLogoAsset.js';
import {
  renderNekocordMascotSvg,
  renderVencordIcon,
  type VencordIconName,
} from './VencordIcons.js';

export type NekocordTab =
  | 'overview'
  | 'plugins'
  | 'themes'
  | 'notifications'
  | 'updater'
  | 'backup';
export type PurrcordTab = NekocordTab;

type NekocordRoute =
  | { kind: 'page'; tab: NekocordTab }
  | { kind: 'plugin'; pluginName: string }
  | { kind: 'import-plugin' };

type PluginStatusFilter =
  | 'all'
  | 'favorites'
  | 'configurable'
  | 'imported'
  | 'enabled'
  | 'disabled';
type PluginCategoryFilter =
  | 'all'
  | 'chat'
  | 'ui'
  | 'privacy'
  | 'utility'
  | 'developer'
  | 'nitro'
  | 'voice';
type ThemeSubTab = 'local' | 'online';
type NotificationFilter = 'all' | 'nekocord' | 'discord' | 'alerts';

let modalVisible = false;
let requestedTab: NekocordTab = 'overview';
const modalListeners = new Set<(open: boolean, tab: NekocordTab) => void>();

/**
 * Opens the Nekocord settings modal, optionally focusing a specific tab.
 */
export function openNekocordSettings(tab: NekocordTab = 'overview'): void {
  modalVisible = true;
  requestedTab = tab;
  for (const listener of Array.from(modalListeners)) {
    listener(true, tab);
  }
}

/**
 * Closes the Nekocord settings modal.
 */
export function closeNekocordSettings(): void {
  modalVisible = false;
  for (const listener of Array.from(modalListeners)) {
    listener(false, requestedTab);
  }
}

interface Palette {
  canvas: string;
  headerBg: string;
  surface: string;
  surfaceAlt: string;
  surfaceHighlight: string;
  divider: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  brand: string;
  brandOnText: string;
  brandSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  switchOff: string;
  specialBg: string;
  specialInk: string;
}

const DARK_PALETTE: Omit<Palette, 'brandOnText'> = {
  canvas: '#121316',
  headerBg: '#121316',
  surface: '#1d1e24',
  surfaceAlt: '#262730',
  surfaceHighlight: '#2e303b',
  divider: '#292b33',
  border: '#31333d',
  textPrimary: '#f2f3f5',
  textSecondary: '#b5bac1',
  textMuted: '#80848e',
  brand: '#5865f2',
  brandSoft: 'rgba(88, 101, 242, 0.18)',
  success: '#23a55a',
  successSoft: 'rgba(35, 165, 90, 0.16)',
  warning: '#f0b232',
  warningSoft: 'rgba(240, 178, 50, 0.16)',
  danger: '#f23f43',
  dangerSoft: 'rgba(242, 63, 67, 0.16)',
  switchOff: '#4e5058',
  specialBg: '#c3a3ce',
  specialInk: '#111214',
};

const LIGHT_PALETTE: Omit<Palette, 'brandOnText'> = {
  canvas: '#f2f3f5',
  headerBg: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#e3e5e8',
  surfaceHighlight: '#d8dbe0',
  divider: '#e6e7ea',
  border: '#dcdee3',
  textPrimary: '#060607',
  textSecondary: '#4e5058',
  textMuted: '#6d6f78',
  brand: '#5865f2',
  brandSoft: 'rgba(88, 101, 242, 0.14)',
  success: '#1a8847',
  successSoft: 'rgba(26, 136, 71, 0.14)',
  warning: '#c88310',
  warningSoft: 'rgba(200, 131, 16, 0.14)',
  danger: '#da373c',
  dangerSoft: 'rgba(218, 55, 60, 0.14)',
  switchOff: '#80848e',
  specialBg: '#d8bfe3',
  specialInk: '#111214',
};

function getContrastOnHex(hex: string): string {
  const clean = hex.trim().replace(/^#/, '');
  let full = clean;
  if (clean.length === 3) {
    full = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return '#ffffff';
  }
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 168 ? '#11111b' : '#ffffff';
}

function getActivePalette(isLight: boolean): Palette {
  const base = isLight ? LIGHT_PALETTE : DARK_PALETTE;
  const overrides = getActiveThemeUiPalette(isLight);
  const merged = overrides ? { ...base, ...overrides } : base;
  return {
    ...merged,
    brandOnText: getContrastOnHex(merged.brand),
  };
}

function getCategoryStyle(category: string | undefined, p: Palette): { bg: string; fg: string } {
  switch (category) {
    case 'privacy':
      return { bg: p.successSoft, fg: '#46c478' };
    case 'chat':
      return { bg: 'rgba(0, 168, 252, 0.16)', fg: '#45c1ff' };
    case 'nitro':
      return { bg: 'rgba(236, 72, 153, 0.16)', fg: '#f472b6' };
    case 'voice':
      return { bg: 'rgba(20, 184, 166, 0.16)', fg: '#2dd4bf' };
    case 'utility':
      return { bg: 'rgba(99, 102, 241, 0.16)', fg: '#818cf8' };
    case 'developer':
      return { bg: p.warningSoft, fg: p.warning };
    case 'ui':
      return { bg: 'rgba(168, 85, 247, 0.16)', fg: '#c084fc' };
    default:
      return { bg: p.surfaceAlt, fg: p.textSecondary };
  }
}

interface MarkdownBlock {
  kind: 'heading' | 'bullet' | 'paragraph';
  text: string;
}

function parseReadmeBlocks(plugin: NekocordPlugin): MarkdownBlock[] {
  const raw = (plugin.readme || plugin.description || '').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');
  const blocks: MarkdownBlock[] = [];
  let paragraphBuf: string[] = [];

  const cleanInline = (line: string) =>
    line
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .trim();

  const flushParagraph = () => {
    if (paragraphBuf.length > 0) {
      const joined = cleanInline(paragraphBuf.join(' '));
      if (joined && joined !== plugin.description) {
        blocks.push({ kind: 'paragraph', text: joined });
      }
      paragraphBuf = [];
    }
  };

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      flushParagraph();
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushParagraph();
      const titleText = cleanInline(trimmed.slice(2));
      if (titleText.toLowerCase() !== plugin.name.toLowerCase()) {
        blocks.push({ kind: 'heading', text: titleText });
      }
      continue;
    }
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      flushParagraph();
      const headingText = cleanInline(trimmed.replace(/^#{2,3}\s+/, ''));
      if (headingText) {
        blocks.push({ kind: 'heading', text: headingText });
      }
      continue;
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph();
      const bulletText = cleanInline(trimmed.slice(2));
      if (bulletText) {
        blocks.push({ kind: 'bullet', text: bulletText });
      }
      continue;
    }
    paragraphBuf.push(trimmed);
  }
  flushParagraph();

  if (blocks.length === 0) {
    blocks.push({ kind: 'paragraph', text: plugin.description });
  }
  return blocks;
}

function getAcronym(name: string): string {
  const upper = name.match(/[A-Z]/g);
  return upper ? upper.join('').toLowerCase() : '';
}

function hasPluginActions(plugin: NekocordPlugin): boolean {
  return plugin.name === 'MessageLogger';
}

/**
 * Creates the root Nekocord modal overlay component mounted above Discord's root view.
 */
export function createNekocordOverlay(React: any, ReactNative: any): any {
  const {
    Animated,
    FlatList,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
  } = ReactNative;
  const h = React.createElement;

  const icon = (name: VencordIconName, size: number, color: string) =>
    renderVencordIcon(React, ReactNative, name, { size, color });

  const styles = StyleSheet.create({
    root: { flex: 1, position: 'relative' },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingTop: 46,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    topBarLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    backBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 19,
      marginRight: 6,
    },
    headerTitle: { fontSize: 19, fontWeight: '700' },
    headerBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      marginLeft: 8,
    },
    headerBadgeText: { fontSize: 12, fontWeight: '600' },
    tabScroll: { borderBottomWidth: 1, flexGrow: 0 },
    tabScrollContent: {
      paddingHorizontal: 12,
      alignItems: 'center',
      flexDirection: 'row',
    },
    tabPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginRight: 4,
      borderBottomWidth: 2,
    },
    tabPillText: { fontSize: 13.5, lineHeight: 18, marginLeft: 6 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 96 },
    sectionHeading: {
      fontSize: 14,
      fontWeight: '700',
      marginTop: 18,
      marginBottom: 8,
    },
    noticeCard: {
      borderRadius: 8,
      borderWidth: 1,
      padding: 13,
      marginBottom: 10,
    },
    addonCard: {
      borderRadius: 8,
      borderWidth: 1,
      padding: 12,
      marginBottom: 8,
    },
    addonHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    addonTitleWrap: {
      flex: 1,
      paddingRight: 8,
    },
    addonTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    addonControls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 6,
    },
    pluginsFixedHeader: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 12,
      height: 42,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      marginLeft: 9,
      paddingVertical: 0,
    },
    filterChip: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      marginRight: 6,
    },
    listContent: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 96 },
    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      padding: 8,
      borderRadius: 10,
      borderWidth: 1,
    },
    quickPill: {
      width: '48.8%',
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 11,
      marginBottom: 7,
    },
    groupedCard: { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
    divider: { height: 1 },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginRight: 8,
      marginBottom: 6,
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      zIndex: 100,
    },
    modalDialog: {
      width: '100%',
      maxWidth: 360,
      borderRadius: 12,
      borderWidth: 1,
      padding: 18,
    },
  });

  function renderSectionHeading(title: string, p: Palette, noTopMargin = false) {
    return h(
      Text,
      {
        style: [
          styles.sectionHeading,
          { color: p.textPrimary, ...(noTopMargin ? { marginTop: 2 } : {}) },
        ],
      },
      title,
    );
  }

  function renderNoticeCard(
    opts: {
      variant: 'normal' | 'warning' | 'success' | 'danger' | 'brand';
      title: string;
      body: string;
      iconName?: VencordIconName;
      actionLabel?: string;
      actionIcon?: VencordIconName;
      onAction?: () => void;
    },
    p: Palette,
  ) {
    let bg = p.surface;
    let border = p.border;
    let accent = p.textPrimary;
    if (opts.variant === 'warning') {
      bg = p.warningSoft;
      border = p.warning;
      accent = p.warning;
    } else if (opts.variant === 'success') {
      bg = p.successSoft;
      border = p.success;
      accent = p.success;
    } else if (opts.variant === 'danger') {
      bg = p.dangerSoft;
      border = p.danger;
      accent = p.danger;
    } else if (opts.variant === 'brand') {
      bg = p.brandSoft;
      border = p.brand;
      accent = p.brand;
    }

    return h(
      View,
      { style: [styles.noticeCard, { backgroundColor: bg, borderColor: border }] },
      h(
        View,
        { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } },
        h(
          View,
          { style: { flex: 1, paddingRight: opts.actionLabel ? 10 : 0 } },
          h(
            View,
            { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 } },
            opts.iconName ? h(View, { style: { marginRight: 7 } }, icon(opts.iconName, 16, accent)) : null,
            h(Text, { style: { color: accent, fontSize: 13.5, fontWeight: '700' } }, opts.title),
          ),
          h(
            Text,
            { style: { color: p.textSecondary, fontSize: 12.5, lineHeight: 17 } },
            opts.body,
          ),
        ),
        opts.actionLabel && opts.onAction
          ? h(
              Pressable,
              {
                onPress: opts.onAction,
                style: {
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: opts.variant === 'warning' ? p.warning : p.brand,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                },
              },
              opts.actionIcon
                ? h(
                    View,
                    { style: { marginRight: 5 } },
                    icon(opts.actionIcon, 14, opts.variant === 'warning' ? '#111214' : p.brandOnText),
                  )
                : null,
              h(
                Text,
                {
                  style: {
                    color: opts.variant === 'warning' ? '#111214' : p.brandOnText,
                    fontSize: 12.5,
                    fontWeight: '700',
                  },
                },
                opts.actionLabel,
              ),
            )
          : null,
      ),
    );
  }

  function renderButton(
    opts: {
      key: string;
      label: string;
      tone?: 'brand' | 'secondary' | 'success' | 'danger';
      iconName?: VencordIconName;
      disabled?: boolean;
      onPress: () => void;
    },
    p: Palette,
  ) {
    const tone = opts.tone ?? 'brand';
    const bg =
      tone === 'brand'
        ? p.brand
        : tone === 'success'
          ? p.success
          : tone === 'danger'
            ? p.danger
            : p.surfaceAlt;
    const fg =
      tone === 'brand'
        ? p.brandOnText
        : tone === 'success' || tone === 'danger'
          ? '#ffffff'
          : p.textPrimary;

    return h(
      Pressable,
      {
        key: opts.key,
        onPress: opts.disabled ? undefined : opts.onPress,
        style: [styles.btn, { backgroundColor: bg, opacity: opts.disabled ? 0.65 : 1 }],
      },
      opts.iconName ? h(View, { style: { marginRight: 7 } }, icon(opts.iconName, 16, fg)) : null,
      h(Text, { style: { color: fg, fontSize: 13.5, fontWeight: '700' } }, opts.label),
    );
  }

  function renderGroupedCard(children: any[], p: Palette) {
    const items = children.filter(Boolean);
    const spaced: any[] = [];
    for (let i = 0; i < items.length; i += 1) {
      if (i > 0) {
        spaced.push(
          h(View, { key: `div-${i}`, style: [styles.divider, { backgroundColor: p.divider }] }),
        );
      }
      spaced.push(items[i]);
    }
    return h(
      View,
      { style: [styles.groupedCard, { backgroundColor: p.surface, borderColor: p.border }] },
      ...spaced,
    );
  }

  function renderInfoRow(key: string, label: string, val: string, p: Palette, dotColor?: string) {
    return h(
      View,
      { key, style: styles.infoRow },
      h(Text, { style: { color: p.textSecondary, fontSize: 14, fontWeight: '500' } }, label),
      h(
        View,
        { style: { flexDirection: 'row', alignItems: 'center' } },
        dotColor
          ? h(View, {
              style: {
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: dotColor,
                marginRight: 7,
              },
            })
          : null,
        h(Text, { style: { color: p.textPrimary, fontSize: 14, fontWeight: '700' } }, val),
      ),
    );
  }

  const DiscordSwitch = React.memo(function DiscordSwitchView(props: {
    value: boolean;
    onValueChange: (next: boolean) => void;
    p: Palette;
    disabled?: boolean;
    accessibilityLabel?: string;
  }) {
    const { value, onValueChange, p, disabled, accessibilityLabel } = props;
    const canAnimate = Boolean(Animated && typeof Animated.Value === 'function' && Animated.View);
    const animRef = React.useRef(canAnimate ? new Animated.Value(value ? 1 : 0) : null);

    React.useEffect(() => {
      if (!canAnimate || !animRef.current || typeof Animated.timing !== 'function') {
        return;
      }
      Animated.timing(animRef.current, {
        toValue: value ? 1 : 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, [canAnimate, value]);

    const thumbTranslate =
      canAnimate && animRef.current && typeof animRef.current.interpolate === 'function'
        ? animRef.current.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 18],
          })
        : value
          ? 18
          : 0;

    const ThumbView = canAnimate ? Animated.View : View;

    return h(
      Pressable,
      {
        onPress: disabled ? undefined : () => onValueChange(!value),
        hitSlop: 6,
        disabled: Boolean(disabled),
        accessible: true,
        accessibilityRole: 'switch',
        accessibilityLabel,
        accessibilityState: { checked: Boolean(value), disabled: Boolean(disabled) },
        style: {
          width: 44,
          height: 26,
          borderRadius: 13,
          padding: 3,
          justifyContent: 'center',
          backgroundColor: value ? p.brand : p.switchOff,
          opacity: disabled ? 0.48 : 1,
        },
      },
      h(
        ThumbView,
        {
          style: {
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ translateX: thumbTranslate }],
          },
        },
        icon(
          value ? 'switchCheck' : 'switchCross',
          value ? 13 : 12,
          value ? p.brand : p.switchOff,
        ),
      ),
    );
  });

  const AuthorChip = React.memo(function AuthorChipView(props: {
    author: PluginAuthor;
    p: Palette;
  }) {
    const { author, p } = props;
    const [imgFailed, setImgFailed]: [boolean, (v: boolean) => void] = React.useState(false);

    React.useEffect(() => {
      setImgFailed(false);
    }, [author.icon]);

    const iconUri = typeof author.icon === 'string' ? author.icon.trim() : '';
    const hasIcon =
      Boolean(Image) &&
      !imgFailed &&
      (iconUri.indexOf('https://') === 0 ||
        iconUri.indexOf('http://') === 0 ||
        iconUri.indexOf('data:') === 0);
    const githubHandle = (author.github || author.name || '').trim();

    return h(
      Pressable,
      {
        onPress: githubHandle
          ? () => openReleasePage(`https://github.com/${encodeURIComponent(githubHandle)}`)
          : undefined,
        style: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: p.surfaceAlt,
          borderRadius: 999,
          paddingVertical: 5,
          paddingLeft: 6,
          paddingRight: 11,
          marginRight: 8,
          marginBottom: 6,
        },
      },
      hasIcon
        ? h(Image, {
            source: { uri: iconUri },
            resizeMode: 'cover',
            onError: () => setImgFailed(true),
            style: {
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: p.brand,
              marginRight: 7,
            },
          })
        : h(
            View,
            {
              style: {
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: p.brand,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 7,
              },
            },
            h(
              Text,
              { style: { color: p.brandOnText, fontSize: 12, fontWeight: '800' } },
              author.name.charAt(0).toUpperCase(),
            ),
          ),
      h(Text, { style: { color: p.textPrimary, fontSize: 13, fontWeight: '600' } }, author.name),
    );
  });

  const PluginCard = React.memo(function PluginCardView(props: {
    plugin: NekocordPlugin;
    enabled: boolean;
    favorite: boolean;
    p: Palette;
    onSelect: (plugin: NekocordPlugin) => void;
    onToggle: (plugin: NekocordPlugin) => void;
  }) {
    const { plugin, enabled, favorite, p, onSelect, onToggle } = props;
    const isConfigurable = hasVisiblePluginSettings(plugin) || hasPluginActions(plugin);

    return h(
      Pressable,
      {
        onPress: () => onSelect(plugin),
        style: [
          styles.addonCard,
          {
            backgroundColor: p.surface,
            borderColor: p.border,
          },
        ],
      },
      h(
        View,
        { style: styles.addonHeader },
        h(
          View,
          { style: styles.addonTitleWrap },
          h(
            View,
            { style: [styles.addonTitleRow, { flexWrap: 'nowrap' }] },
            h(
              Text,
              {
                numberOfLines: 1,
                style: {
                  color: p.textPrimary,
                  fontSize: 15,
                  fontWeight: '700',
                  flexShrink: 1,
                },
              },
              plugin.name,
            ),
            favorite
              ? h(View, { style: { marginLeft: 5 } }, icon('starFilled', 13, '#f0b232'))
              : null,
            isConfigurable
              ? h(
                  Pressable,
                  {
                    onPress: () => onSelect(plugin),
                    hitSlop: 8,
                    accessible: true,
                    accessibilityRole: 'button',
                    accessibilityLabel: `${plugin.name} settings`,
                    style: {
                      marginLeft: 6,
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      backgroundColor: p.surfaceAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  },
                  icon('cogWheel', 14.5, p.textSecondary),
                )
              : null,
            h(
              Pressable,
              {
                onPress: () => onSelect(plugin),
                hitSlop: 8,
                accessible: true,
                accessibilityRole: 'button',
                accessibilityLabel: `${plugin.name} info`,
                style: {
                  marginLeft: 5,
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: plugin.requiresRestart ? p.warningSoft : p.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              },
              icon('exclamation', 14.5, plugin.requiresRestart ? p.warning : p.textSecondary),
            ),
          ),
        ),
        h(
          View,
          { style: styles.addonControls },
          h(DiscordSwitch, {
            value: enabled,
            p,
            accessibilityLabel: `Toggle ${plugin.name}`,
            onValueChange: () => onToggle(plugin),
          }),
        ),
      ),
      h(
        Text,
        {
          numberOfLines: 2,
          style: {
            color: p.textSecondary,
            fontSize: 12.5,
            lineHeight: 17,
            marginTop: 6,
          },
        },
        plugin.description,
      ),
    );
  });

  const ThemeCard = React.memo(function ThemeCardView(props: {
    theme: NekocordTheme;
    active: boolean;
    p: Palette;
    onSelect: (theme: NekocordTheme) => void;
    onDelete: (theme: NekocordTheme) => void;
  }) {
    const { theme, active, p, onSelect, onDelete } = props;
    const swatches = theme.preview ?? ['#1e1e2e', '#181825', '#5865f2'];
    const authorsLabel = theme.authors?.length ? theme.authors.join(', ') : 'flufstails';

    return h(
      View,
      {
        style: [
          styles.addonCard,
          {
            backgroundColor: p.surface,
            borderColor: active ? p.brand : p.border,
          },
        ],
      },
      h(
        View,
        { style: styles.addonHeader },
        h(
          View,
          {
            style: {
              flexDirection: 'row',
              borderRadius: 6,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: p.border,
              marginRight: 10,
            },
          },
          ...swatches.slice(0, 3).map((hex, idx) =>
            h(View, { key: `sw-${idx}`, style: { width: 8, height: 28, backgroundColor: hex } }),
          ),
        ),
        h(
          View,
          { style: styles.addonTitleWrap },
          h(
            View,
            { style: styles.addonTitleRow },
            h(
              Text,
              { style: { color: p.textPrimary, fontSize: 15, fontWeight: '700' } },
              theme.name,
            ),
            h(
              View,
              {
                style: {
                  marginLeft: 6,
                  backgroundColor: theme.kind === 'css' ? p.brandSoft : p.surfaceAlt,
                  borderRadius: 4,
                  paddingHorizontal: 5.5,
                  paddingVertical: 1.5,
                },
              },
              h(
                Text,
                {
                  style: {
                    color: theme.kind === 'css' ? '#8ea1ff' : p.textSecondary,
                    fontSize: 9.5,
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  },
                },
                theme.kind === 'css' ? 'CSS' : 'JSON',
              ),
            ),
            theme.baseMode
              ? h(
                  View,
                  {
                    style: {
                      marginLeft: 5,
                      backgroundColor: p.surfaceAlt,
                      borderRadius: 4,
                      paddingHorizontal: 5,
                      paddingVertical: 1.5,
                    },
                  },
                  h(
                    Text,
                    {
                      style: {
                        color: p.textMuted,
                        fontSize: 9,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      },
                    },
                    theme.baseMode,
                  ),
                )
              : null,
          ),
          h(
            Text,
            { style: { color: p.textMuted, fontSize: 11.5, marginTop: 1 } },
            `by ${authorsLabel}`,
          ),
        ),
        h(
          View,
          { style: styles.addonControls },
          !theme.builtin
            ? h(
                Pressable,
                {
                  onPress: () => onDelete(theme),
                  hitSlop: 8,
                  style: [styles.iconButton, { backgroundColor: p.dangerSoft }],
                },
                icon('delete', 16, p.danger),
              )
            : null,
          h(DiscordSwitch, {
            value: active,
            p,
            accessibilityLabel: `Toggle ${theme.name} theme`,
            onValueChange: () => onSelect(theme),
          }),
        ),
      ),
      theme.description
        ? h(
            Text,
            {
              numberOfLines: 2,
              style: {
                color: p.textSecondary,
                fontSize: 12.5,
                lineHeight: 17,
                marginTop: 7,
              },
            },
            theme.description,
          )
        : null,
    );
  });

  const OverviewTab = React.memo(function OverviewTabView(ctx: {
    p: Palette;
    version: string;
    tagline: string;
    enabledPlugins: number;
    totalPlugins: number;
    activeTheme: NekocordTheme | null;
    activeSet: ReadonlySet<string>;
    onOpenTab: (tab: NekocordTab) => void;
    onCheckUpdatesAndOpen: () => void;
    onReloadApp: () => void;
    onOpenRepo: () => void;
    onToggleQuickSwitch: (pluginName: string) => void;
  }) {
    const { p } = ctx;

    const quickActions: Array<{
      key: string;
      icon: VencordIconName;
      label: string;
      onPress: () => void;
    }> = [
      { key: 'qa-plugins', icon: 'plugins', label: 'Plugins', onPress: () => ctx.onOpenTab('plugins') },
      { key: 'qa-themes', icon: 'paintbrush', label: 'Themes', onPress: () => ctx.onOpenTab('themes') },
      {
        key: 'qa-notif',
        icon: 'log',
        label: 'Notification Log',
        onPress: () => ctx.onOpenTab('notifications'),
      },
      {
        key: 'qa-updater',
        icon: 'updater',
        label: 'Check Updates',
        onPress: ctx.onCheckUpdatesAndOpen,
      },
      {
        key: 'qa-backup',
        icon: 'backupRestore',
        label: 'Backup & Restore',
        onPress: () => ctx.onOpenTab('backup'),
      },
      { key: 'qa-source', icon: 'github', label: 'View Source Code', onPress: ctx.onOpenRepo },
    ];

    const quickSwitches: Array<{ name: string; title: string; subtitle: string }> = [
      {
        name: 'NoTrack',
        title: 'Block Discord Analytics',
        subtitle: 'Suppress science, telemetry, and tracking network requests',
      },
      {
        name: 'FakeNitro',
        title: 'FakeNitro',
        subtitle: 'Send external emojis & stickers cleanly without Nitro',
      },
      {
        name: 'MessageLogger',
        title: 'MessageLogger',
        subtitle: 'Preserve deleted messages & edit history inline',
      },
      {
        name: 'DeveloperMode',
        title: 'Developer Mode',
        subtitle: 'Enable ID copying and developer options across Discord',
      },
    ];

    return h(
      React.Fragment,
      null,
      // Vencord SpecialCard hero banner
      h(
        View,
        {
          style: {
            backgroundColor: p.specialBg,
            borderRadius: 12,
            padding: 16,
            marginBottom: 4,
          },
        },
        h(
          View,
          { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } },
          h(
            View,
            { style: { flex: 1, paddingRight: 12 } },
            h(
              View,
              { style: { flexDirection: 'row', alignItems: 'center' } },
              h(
                Text,
                { style: { color: p.specialInk, fontSize: 21, fontWeight: '800' } },
                'Nekocord',
              ),
              h(
                View,
                {
                  style: {
                    marginLeft: 8,
                    backgroundColor: 'rgba(17, 18, 20, 0.14)',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 6,
                  },
                },
                h(
                  Text,
                  { style: { color: p.specialInk, fontSize: 11, fontWeight: '800' } },
                  `v${ctx.version}`,
                ),
              ),
            ),
            h(
              Text,
              { style: { color: p.specialInk, fontSize: 14, fontWeight: '700', marginTop: 4 } },
              ctx.tagline,
            ),
            h(
              Text,
              {
                style: {
                  color: 'rgba(17, 18, 20, 0.78)',
                  fontSize: 12.5,
                  fontWeight: '600',
                  marginTop: 6,
                },
              },
              `${ctx.enabledPlugins} of ${ctx.totalPlugins} plugins active • Discord 353.11`,
            ),
          ),
          h(
            View,
            {
              style: {
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor: '#ffffff',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              },
            },
            Image
              ? h(Image, {
                  source: { uri: NEKOCORD_LOGO_DATA_URI },
                  style: { width: 58, height: 58 },
                  resizeMode: 'contain',
                })
              : renderNekocordMascotSvg(React, ReactNative, 48),
          ),
        ),
        h(View, {
          style: {
            height: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.45)',
            marginTop: 12,
            marginBottom: 10,
          },
        }),
        h(
          Pressable,
          {
            onPress: ctx.onOpenRepo,
            style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
          },
          icon('openExternal', 15, p.specialInk),
          h(
            Text,
            { style: { color: p.specialInk, fontSize: 13.5, fontWeight: '800', marginLeft: 7 } },
            `View Source on GitHub (${DEFAULT_UPDATE_SOURCE})`,
          ),
        ),
      ),

      renderSectionHeading('Quick Actions', p),
      h(
        View,
        {
          style: [styles.quickGrid, { backgroundColor: p.surface, borderColor: p.border }],
        },
        ...quickActions.map((qa, idx) =>
          h(
            Pressable,
            {
              key: qa.key,
              onPress: qa.onPress,
              style: [
                styles.quickPill,
                {
                  backgroundColor: p.surfaceAlt,
                  marginBottom: idx >= quickActions.length - 2 ? 0 : 7,
                },
              ],
            },
            icon(qa.icon, 20, p.textPrimary),
            h(
              Text,
              {
                numberOfLines: 1,
                style: {
                  color: p.textPrimary,
                  fontSize: 13,
                  fontWeight: '600',
                  marginLeft: 8,
                  flex: 1,
                },
              },
              qa.label,
            ),
          ),
        ),
      ),

      renderSectionHeading('Settings', p),
      renderGroupedCard(
        quickSwitches.map((item) => {
          const enabled = ctx.activeSet.has(item.name);
          return h(
            View,
            {
              key: `qs-${item.name}`,
              style: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 14,
                paddingVertical: 12,
              },
            },
            h(
              View,
              { style: { flex: 1, paddingRight: 12 } },
              h(Text, { style: { color: p.textPrimary, fontSize: 14.5, fontWeight: '600' } }, item.title),
              h(
                Text,
                { style: { color: p.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2 } },
                item.subtitle,
              ),
            ),
            h(DiscordSwitch, {
              value: enabled,
              p,
              accessibilityLabel: `Toggle ${item.title}`,
              onValueChange: () => ctx.onToggleQuickSwitch(item.name),
            }),
          );
        }),
        p,
      ),

      renderSectionHeading('Client Summary', p),
      renderGroupedCard(
        [
          renderInfoRow('ov-ver', 'Version', `v${ctx.version}`, p),
          renderInfoRow('ov-plug', 'Active Plugins', `${ctx.enabledPlugins} / ${ctx.totalPlugins}`, p),
          renderInfoRow('ov-theme', 'Active Theme', ctx.activeTheme ? ctx.activeTheme.name : 'Stock Discord', p),
          renderInfoRow('ov-author', 'Maintainer', 'flufstails', p),
        ],
        p,
      ),
    );
  });

  const PluginDetailTab = React.memo(function PluginDetailView(ctx: {
    p: Palette;
    plugin: NekocordPlugin;
    enabled: boolean;
    favorite: boolean;
    settingsTick: number;
    onTogglePlugin: (plugin: NekocordPlugin) => void;
    onToggleFavorite: (plugin: NekocordPlugin) => void;
    onOpenPluginGithub: (plugin: NekocordPlugin) => void;
    onSettingChanged: (plugin: NekocordPlugin, key: string, restartNeeded?: boolean) => void;
    onResetPluginSettings: (plugin: NekocordPlugin) => void;
    onClearHistory: () => void;
    onUninstallPlugin: (plugin: NekocordPlugin) => void;
  }) {
    const { p, plugin, favorite } = ctx;
    const catStyle = getCategoryStyle(plugin.category, p);
    const readmeBlocks = React.useMemo(() => parseReadmeBlocks(plugin), [plugin]);
    const tags = plugin.tags?.filter((t) => t !== plugin.category).slice(0, 6) ?? [];
    const rawAuthors = normalizePluginAuthors(plugin.authors, plugin.authorIcon);
    const authors: PluginAuthor[] =
      rawAuthors.length > 0
        ? rawAuthors
        : [{ name: 'flufstails', ...(plugin.authorIcon ? { icon: plugin.authorIcon } : {}) }];
    const settingEntries: Array<[string, PluginSettingDef]> = React.useMemo(() => {
      if (!plugin.settings?.def) return [];
      const defMap = plugin.settings.def as Record<string, PluginSettingDef>;
      return Object.entries(defMap).filter(([, opt]) => !opt.hidden);
    }, [plugin]);

    const renderSettingRow = (key: string, opt: PluginSettingDef) => {
      const label = formatSettingLabel(key, opt.label);
      const currentVal = plugin.settings!.get(key);

      if (opt.type === OptionType.BOOLEAN) {
        return h(
          View,
          {
            key: `opt-${key}`,
            style: {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 14,
              paddingVertical: 12,
            },
          },
          h(
            View,
            { style: { flex: 1, paddingRight: 12 } },
            h(Text, { style: { color: p.textPrimary, fontSize: 14.5, fontWeight: '600' } }, label),
            h(
              Text,
              { style: { color: p.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2 } },
              opt.description,
            ),
          ),
          h(DiscordSwitch, {
            value: Boolean(currentVal),
            p,
            accessibilityLabel: label,
            onValueChange: (val: boolean) => {
              plugin.settings!.set(key, val);
              ctx.onSettingChanged(plugin, key, opt.restartNeeded);
            },
          }),
        );
      }

      if (opt.type === OptionType.STRING) {
        return h(
          View,
          {
            key: `opt-${key}`,
            style: { paddingHorizontal: 14, paddingVertical: 12 },
          },
          h(Text, { style: { color: p.textPrimary, fontSize: 14.5, fontWeight: '600' } }, label),
          h(
            Text,
            { style: { color: p.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2, marginBottom: 8 } },
            opt.description,
          ),
          TextInput
            ? h(TextInput, {
                value: String(currentVal ?? ''),
                onChangeText: (text: string) => {
                  plugin.settings!.set(key, text);
                  ctx.onSettingChanged(plugin, key, opt.restartNeeded);
                },
                placeholder: opt.placeholder ?? '',
                placeholderTextColor: p.textMuted,
                autoCapitalize: 'none',
                autoCorrect: false,
                style: {
                  backgroundColor: p.surfaceAlt,
                  borderColor: p.border,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 11,
                  height: 38,
                  color: p.textPrimary,
                  fontSize: 13,
                },
              })
            : null,
        );
      }

      if (opt.type === OptionType.NUMBER) {
        const step = opt.step ?? 1;
        const num = typeof currentVal === 'number' ? currentVal : opt.default;
        const updateNum = (delta: number) => {
          const next = Math.round((num + delta) * 1000) / 1000;
          plugin.settings!.set(key, next);
          ctx.onSettingChanged(plugin, key, opt.restartNeeded);
        };
        return h(
          View,
          {
            key: `opt-${key}`,
            style: {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 14,
              paddingVertical: 12,
            },
          },
          h(
            View,
            { style: { flex: 1, paddingRight: 10 } },
            h(Text, { style: { color: p.textPrimary, fontSize: 14.5, fontWeight: '600' } }, label),
            h(
              Text,
              { style: { color: p.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2 } },
              opt.description,
            ),
          ),
          h(
            View,
            { style: { flexDirection: 'row', alignItems: 'center' } },
            h(
              Pressable,
              {
                onPress: () => updateNum(-step),
                style: {
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  backgroundColor: p.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              },
              h(Text, { style: { color: p.textPrimary, fontSize: 16, fontWeight: '700' } }, '-'),
            ),
            h(
              Text,
              {
                style: {
                  color: p.textPrimary,
                  fontSize: 13.5,
                  fontWeight: '700',
                  minWidth: 38,
                  textAlign: 'center',
                },
              },
              String(num),
            ),
            h(
              Pressable,
              {
                onPress: () => updateNum(step),
                style: {
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  backgroundColor: p.surfaceAlt,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              },
              h(Text, { style: { color: p.textPrimary, fontSize: 16, fontWeight: '700' } }, '+'),
            ),
          ),
        );
      }

      if (opt.type === OptionType.SELECT) {
        return h(
          View,
          {
            key: `opt-${key}`,
            style: { paddingHorizontal: 14, paddingVertical: 12 },
          },
          h(Text, { style: { color: p.textPrimary, fontSize: 14.5, fontWeight: '600' } }, label),
          h(
            Text,
            { style: { color: p.textMuted, fontSize: 12, lineHeight: 16, marginTop: 2, marginBottom: 8 } },
            opt.description,
          ),
          h(
            View,
            { style: { flexDirection: 'row', flexWrap: 'wrap' } },
            ...opt.options.map((choice, cIdx) => {
              const selected = currentVal === choice.value;
              return h(
                Pressable,
                {
                  key: `sel-${key}-${cIdx}`,
                  onPress: () => {
                    plugin.settings!.set(key, choice.value);
                    ctx.onSettingChanged(plugin, key, opt.restartNeeded);
                  },
                  style: {
                    backgroundColor: selected ? p.brand : p.surfaceAlt,
                    borderColor: selected ? p.brand : p.border,
                    borderWidth: 1,
                    borderRadius: 7,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    marginRight: 6,
                    marginBottom: 5,
                  },
                },
                h(
                  Text,
                  {
                    style: {
                      color: selected ? p.brandOnText : p.textSecondary,
                      fontSize: 12.5,
                      fontWeight: selected ? '700' : '600',
                    },
                  },
                  choice.label,
                ),
              );
            }),
          ),
        );
      }

      return null;
    };

    return h(
      React.Fragment,
      null,
      h(
        View,
        {
          style: {
            backgroundColor: p.surface,
            borderColor: p.border,
            borderWidth: 1,
            borderRadius: 10,
            padding: 15,
          },
        },
        h(
          View,
          { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } },
          h(
            View,
            { style: { flex: 1, paddingRight: 10, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' } },
            h(
              Text,
              { style: { color: p.textPrimary, fontSize: 19, fontWeight: '800' } },
              plugin.name,
            ),
            plugin.category
              ? h(
                  View,
                  {
                    style: {
                      marginLeft: 8,
                      backgroundColor: catStyle.bg,
                      borderRadius: 5,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                    },
                  },
                  h(
                    Text,
                    {
                      style: {
                        color: catStyle.fg,
                        fontSize: 10.5,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      },
                    },
                    plugin.category,
                  ),
                )
              : null,
            plugin.requiresRestart
              ? h(
                  View,
                  {
                    style: {
                      marginLeft: 6,
                      backgroundColor: p.warningSoft,
                      borderRadius: 5,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    },
                  },
                  h(Text, { style: { color: p.warning, fontSize: 10, fontWeight: '700' } }, 'RESTART'),
                )
              : null,
            plugin.isNew
              ? h(
                  View,
                  {
                    style: {
                      marginLeft: 6,
                      backgroundColor: p.danger,
                      borderRadius: 5,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    },
                  },
                  h(Text, { style: { color: '#ffffff', fontSize: 10, fontWeight: '800' } }, 'NEW'),
                )
              : null,
            plugin.imported
              ? h(
                  View,
                  {
                    style: {
                      marginLeft: 6,
                      backgroundColor: p.brandSoft,
                      borderRadius: 5,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    },
                  },
                  h(Text, { style: { color: '#8ea1ff', fontSize: 10, fontWeight: '800' } }, 'IMPORTED'),
                )
              : null,
          ),
          h(
            View,
            { style: { flexDirection: 'row', alignItems: 'center' } },
            h(
              Pressable,
              {
                onPress: () => ctx.onToggleFavorite(plugin),
                hitSlop: 8,
                accessible: true,
                accessibilityLabel: favorite ? 'Remove from favorites' : 'Add to favorites',
                style: [styles.iconButton, { backgroundColor: p.surfaceAlt }],
              },
              icon(favorite ? 'starFilled' : 'starOutlined', 18, favorite ? '#f0b232' : p.textSecondary),
            ),
            h(
              Pressable,
              {
                onPress: () => ctx.onOpenPluginGithub(plugin),
                hitSlop: 8,
                accessible: true,
                accessibilityLabel: 'View source code on GitHub',
                style: [styles.iconButton, { backgroundColor: p.surfaceAlt, marginRight: 0 }],
              },
              icon('github', 18, p.textPrimary),
            ),
          ),
        ),
        h(
          Text,
          { style: { color: p.textSecondary, fontSize: 13.5, lineHeight: 19, marginTop: 10 } },
          plugin.description,
        ),
        tags.length > 0
          ? h(
              View,
              { style: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 } },
              ...tags.map((tag) =>
                h(
                  View,
                  {
                    key: `tag-${tag}`,
                    style: {
                      backgroundColor: p.surfaceAlt,
                      borderRadius: 5,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      marginRight: 6,
                      marginTop: 4,
                    },
                  },
                  h(Text, { style: { color: p.textMuted, fontSize: 11, fontWeight: '600' } }, tag),
                ),
              ),
            )
          : null,
      ),

      renderSectionHeading('Authors', p),
      h(
        View,
        {
          style: {
            backgroundColor: p.surface,
            borderColor: p.border,
            borderWidth: 1,
            borderRadius: 10,
            paddingTop: 12,
            paddingHorizontal: 12,
            paddingBottom: 6,
            flexDirection: 'row',
            flexWrap: 'wrap',
          },
        },
        ...authors.map((author, idx) =>
          h(AuthorChip, {
            key: `auth-${author.name}-${idx}`,
            author,
            p,
          }),
        ),
      ),

      renderSectionHeading('Settings', p),
      renderGroupedCard(
        [
          h(
            View,
            {
              key: 'pd-toggle',
              style: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 14,
                paddingVertical: 12,
              },
            },
            h(
              Text,
              { style: { color: p.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 } },
              `Enable ${plugin.name}`,
            ),
            h(DiscordSwitch, {
              value: ctx.enabled,
              p,
              accessibilityLabel: `Enable ${plugin.name}`,
              onValueChange: () => ctx.onTogglePlugin(plugin),
            }),
          ),
          ...settingEntries.map(([key, opt]) => renderSettingRow(key, opt)),
          settingEntries.length === 0 && plugin.name !== 'MessageLogger'
            ? h(
                View,
                { key: 'pd-none', style: { paddingHorizontal: 14, paddingVertical: 11 } },
                h(
                  Text,
                  { style: { color: p.textMuted, fontSize: 13 } },
                  'There are no additional settings for this plugin.',
                ),
              )
            : null,
          settingEntries.length > 0
            ? h(
                Pressable,
                {
                  key: 'pd-reset',
                  onPress: () => ctx.onResetPluginSettings(plugin),
                  style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  },
                },
                h(
                  View,
                  { style: { flexDirection: 'row', alignItems: 'center' } },
                  icon('restart', 16, p.textSecondary),
                  h(
                    Text,
                    { style: { color: p.textSecondary, fontSize: 14, fontWeight: '600', marginLeft: 8 } },
                    'Reset Plugin Settings',
                  ),
                ),
                icon('rightArrow', 16, p.textMuted),
              )
            : null,
          plugin.name === 'MessageLogger'
            ? h(
                Pressable,
                {
                  key: 'ml-clear',
                  onPress: ctx.onClearHistory,
                  style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  },
                },
                h(
                  View,
                  { style: { flexDirection: 'row', alignItems: 'center' } },
                  icon('delete', 17, p.danger),
                  h(
                    Text,
                    { style: { color: p.danger, fontSize: 14.5, fontWeight: '600', marginLeft: 8 } },
                    'Clear Inline History',
                  ),
                ),
                icon('rightArrow', 16, p.textMuted),
              )
            : null,
        ],
        p,
      ),

      renderSectionHeading('Documentation (README.md)', p),
      h(
        View,
        {
          style: {
            backgroundColor: p.surface,
            borderColor: p.border,
            borderWidth: 1,
            borderRadius: 10,
            padding: 14,
          },
        },
        ...readmeBlocks.map((block: MarkdownBlock, bIdx: number) => {
          if (block.kind === 'heading') {
            return h(
              Text,
              {
                key: `doc-${bIdx}`,
                style: {
                  color: p.textPrimary,
                  fontSize: 14,
                  fontWeight: '700',
                  marginTop: bIdx > 0 ? 10 : 0,
                  marginBottom: 4,
                },
              },
              block.text,
            );
          }
          if (block.kind === 'bullet') {
            return h(
              View,
              {
                key: `doc-${bIdx}`,
                style: { flexDirection: 'row', marginTop: bIdx > 0 ? 5 : 0 },
              },
              h(
                Text,
                { style: { color: p.brand, fontSize: 13, fontWeight: '700', marginRight: 8 } },
                '\u2022',
              ),
              h(
                Text,
                { style: { color: p.textSecondary, fontSize: 13, lineHeight: 19, flex: 1 } },
                block.text,
              ),
            );
          }
          return h(
            Text,
            {
              key: `doc-${bIdx}`,
              style: {
                color: p.textSecondary,
                fontSize: 13,
                lineHeight: 19,
                marginTop: bIdx > 0 ? 8 : 0,
              },
            },
            block.text,
          );
        }),
      ),

      renderSectionHeading('Details', p),
      renderGroupedCard(
        [
          renderInfoRow(
            'pd-status',
            'Status',
            ctx.enabled ? 'Enabled' : 'Disabled',
            p,
            ctx.enabled ? p.success : p.textMuted,
          ),
          renderInfoRow('pd-cat', 'Category', plugin.category.toUpperCase(), p),
          renderInfoRow(
            'pd-dir',
            plugin.imported ? 'Source' : 'Directory',
            plugin.imported ? plugin.sourceUrl ?? 'Imported snippet' : `plugins/${plugin.slug}`,
            p,
          ),
          plugin.requiresRestart
            ? renderInfoRow('pd-restart', 'Requires Restart', 'Yes', p, p.warning)
            : null,
          plugin.imported
            ? h(
                Pressable,
                {
                  key: 'pd-uninstall',
                  onPress: () => ctx.onUninstallPlugin(plugin),
                  style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  },
                },
                h(
                  View,
                  { style: { flexDirection: 'row', alignItems: 'center' } },
                  icon('delete', 17, p.danger),
                  h(
                    Text,
                    { style: { color: p.danger, fontSize: 14.5, fontWeight: '600', marginLeft: 8 } },
                    'Uninstall Imported Plugin',
                  ),
                ),
                icon('rightArrow', 16, p.textMuted),
              )
            : null,
        ],
        p,
      ),
    );
  });

  function PluginsTabView(ctx: {
    p: Palette;
    plugins: NekocordPlugin[];
    activeSet: ReadonlySet<string>;
    favoriteSet: ReadonlySet<string>;
    pendingRestartNames: string[];
    searchQuery: string;
    statusFilter: PluginStatusFilter;
    categoryFilter: PluginCategoryFilter;
    onSearchChange: (q: string) => void;
    onStatusFilterChange: (f: PluginStatusFilter) => void;
    onCategoryFilterChange: (f: PluginCategoryFilter) => void;
    onSelectPlugin: (plugin: NekocordPlugin) => void;
    onTogglePlugin: (plugin: NekocordPlugin) => void;
    onRestartNow: () => void;
    onOpenImportPlugin: () => void;
  }) {
    const {
      p,
      plugins,
      activeSet,
      favoriteSet,
      pendingRestartNames,
      searchQuery,
      statusFilter,
      categoryFilter,
    } = ctx;

    const categoryCounts = React.useMemo(() => {
      const counts: Record<string, number> = {};
      for (let i = 0; i < plugins.length; i += 1) {
        const cat = plugins[i].category;
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
      return counts;
    }, [plugins]);

    const visibleEnabledCount = React.useMemo(() => {
      let total = 0;
      for (let i = 0; i < plugins.length; i += 1) {
        if (activeSet.has(plugins[i].name)) {
          total += 1;
        }
      }
      return total;
    }, [plugins, activeSet]);

    const configurableCount = React.useMemo(() => {
      let total = 0;
      for (let i = 0; i < plugins.length; i += 1) {
        const pl = plugins[i];
        if (hasVisiblePluginSettings(pl) || hasPluginActions(pl)) {
          total += 1;
        }
      }
      return total;
    }, [plugins]);

    const importedCount = React.useMemo(() => {
      let total = 0;
      for (let i = 0; i < plugins.length; i += 1) {
        if (plugins[i].imported) total += 1;
      }
      return total;
    }, [plugins]);

    const sortedAndFiltered = React.useMemo(() => {
      const normalized = searchQuery.trim().toLowerCase();
      const matched = plugins.filter((plugin) => {
        const enabled = activeSet.has(plugin.name);
        const fav = favoriteSet.has(plugin.name);
        const configurable = hasVisiblePluginSettings(plugin) || hasPluginActions(plugin);

        if (statusFilter === 'favorites' && !fav) return false;
        if (statusFilter === 'configurable' && !configurable) return false;
        if (statusFilter === 'imported' && !plugin.imported) return false;
        if (statusFilter === 'enabled' && !enabled) return false;
        if (statusFilter === 'disabled' && enabled) return false;
        if (categoryFilter !== 'all' && plugin.category !== categoryFilter) return false;

        if (!normalized) return true;
        if (
          plugin.name.toLowerCase().includes(normalized) ||
          getAcronym(plugin.name).includes(normalized) ||
          plugin.description.toLowerCase().includes(normalized) ||
          plugin.category.toLowerCase().includes(normalized)
        ) {
          return true;
        }
        if (plugin.tags) {
          for (let t = 0; t < plugin.tags.length; t += 1) {
            if (plugin.tags[t].toLowerCase().includes(normalized)) {
              return true;
            }
          }
        }
        return false;
      });

      if (favoriteSet.size === 0) {
        return matched;
      }
      const favs: NekocordPlugin[] = [];
      const rest: NekocordPlugin[] = [];
      for (let i = 0; i < matched.length; i += 1) {
        const item = matched[i];
        if (favoriteSet.has(item.name)) favs.push(item);
        else rest.push(item);
      }
      return [...favs, ...rest];
    }, [plugins, activeSet, favoriteSet, searchQuery, statusFilter, categoryFilter]);

    const statusOptions: Array<{ id: PluginStatusFilter; label: string }> = [
      { id: 'all', label: `Show All (${plugins.length})` },
      { id: 'favorites', label: `Favorites (${favoriteSet.size})` },
      { id: 'configurable', label: `Configurable (${configurableCount})` },
      ...(importedCount > 0
        ? [{ id: 'imported' as PluginStatusFilter, label: `Imported (${importedCount})` }]
        : []),
      { id: 'enabled', label: `Enabled (${visibleEnabledCount})` },
      { id: 'disabled', label: `Disabled (${Math.max(0, plugins.length - visibleEnabledCount)})` },
    ];

    const categoryOptions: Array<{ id: PluginCategoryFilter; label: string }> = [
      { id: 'all', label: 'All Tags' },
      { id: 'chat', label: `Chat (${categoryCounts.chat ?? 0})` },
      { id: 'ui', label: `UI (${categoryCounts.ui ?? 0})` },
      { id: 'privacy', label: `Privacy (${categoryCounts.privacy ?? 0})` },
      { id: 'utility', label: `Utility (${categoryCounts.utility ?? 0})` },
      { id: 'developer', label: `Dev (${categoryCounts.developer ?? 0})` },
      { id: 'nitro', label: `Nitro (${categoryCounts.nitro ?? 0})` },
      { id: 'voice', label: `Voice (${categoryCounts.voice ?? 0})` },
    ];

    const keyExtractor = React.useCallback((item: NekocordPlugin) => item.name, []);
    const renderItem = React.useCallback(
      ({ item }: { item: NekocordPlugin }) =>
        h(PluginCard, {
          plugin: item,
          enabled: activeSet.has(item.name),
          favorite: favoriteSet.has(item.name),
          p,
          onSelect: ctx.onSelectPlugin,
          onToggle: ctx.onTogglePlugin,
        }),
      [activeSet, favoriteSet, p, ctx.onSelectPlugin, ctx.onTogglePlugin],
    );

    const fixedHeader = h(
      View,
      { style: styles.pluginsFixedHeader },
      pendingRestartNames.length > 0
        ? renderNoticeCard(
            {
              variant: 'warning',
              title: 'Restart required!',
              body: `Restart now to apply pending changes (${pendingRestartNames.slice(0, 3).join(', ')}${pendingRestartNames.length > 3 ? '...' : ''})`,
              iconName: 'restart',
              actionLabel: 'Restart',
              actionIcon: 'restart',
              onAction: ctx.onRestartNow,
            },
            p,
          )
        : renderNoticeCard(
            {
              variant: 'normal',
              title: 'Plugin Management',
              body: 'Tap the cog or (!) icon beside any plugin title for tags, settings, and documentation.',
              iconName: 'info',
            },
            p,
          ),
      h(
        View,
        { style: { flexDirection: 'row', alignItems: 'center' } },
        h(
          View,
          {
            style: [
              styles.searchBox,
              { flex: 1, backgroundColor: p.surface, borderColor: p.border },
            ],
          },
          icon('search', 17, p.textMuted),
          TextInput
            ? h(TextInput, {
                value: searchQuery,
                onChangeText: ctx.onSearchChange,
                placeholder: 'Search for a plugin...',
                placeholderTextColor: p.textMuted,
                autoCapitalize: 'none',
                autoCorrect: false,
                style: [styles.searchInput, { color: p.textPrimary }],
              })
            : null,
          searchQuery.length > 0
            ? h(
                Pressable,
                {
                  onPress: () => ctx.onSearchChange(''),
                  style: {
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: p.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                },
                h(Text, { style: { color: p.textSecondary, fontSize: 12, fontWeight: '700' } }, 'x'),
              )
            : null,
        ),
        h(
          Pressable,
          {
            onPress: ctx.onOpenImportPlugin,
            accessible: true,
            accessibilityRole: 'button',
            accessibilityLabel: 'Import custom plugin',
            style: {
              marginLeft: 8,
              height: 42,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: p.brand,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            },
          },
          icon('plus', 15, p.brandOnText),
          h(
            Text,
            { style: { color: p.brandOnText, fontSize: 13, fontWeight: '700', marginLeft: 5 } },
            'Import',
          ),
        ),
      ),
      h(
        ScrollView,
        {
          horizontal: true,
          showsHorizontalScrollIndicator: false,
          keyboardShouldPersistTaps: 'handled',
          style: { marginTop: 8 },
          contentContainerStyle: { paddingRight: 8 },
        },
        ...statusOptions.map((item) => {
          const active = statusFilter === item.id;
          return h(
            Pressable,
            {
              key: `st-${item.id}`,
              onPress: () => ctx.onStatusFilterChange(item.id),
              style: [
                styles.filterChip,
                {
                  backgroundColor: active ? p.brand : p.surface,
                  borderColor: active ? p.brand : p.border,
                },
              ],
            },
            h(
              Text,
              {
                style: {
                  color: active ? p.brandOnText : p.textSecondary,
                  fontSize: 12,
                  fontWeight: active ? '700' : '600',
                },
              },
              item.label,
            ),
          );
        }),
        ...categoryOptions
          .filter((item) => item.id !== 'all' || categoryFilter !== 'all')
          .map((item) => {
            const active = categoryFilter === item.id;
            return h(
              Pressable,
              {
                key: `cat-${item.id}`,
                onPress: () =>
                  ctx.onCategoryFilterChange(active ? 'all' : item.id),
                style: [
                  styles.filterChip,
                  {
                    backgroundColor: active ? p.brandSoft : p.surface,
                    borderColor: active ? p.brand : p.border,
                  },
                ],
              },
              h(
                Text,
                {
                  style: {
                    color: active ? p.textPrimary : p.textMuted,
                    fontSize: 12,
                    fontWeight: active ? '700' : '600',
                  },
                },
                item.label,
              ),
            );
          }),
      ),
    );

    const emptyView = h(
      View,
      {
        style: {
          backgroundColor: p.surface,
          borderColor: p.border,
          borderWidth: 1,
          borderRadius: 10,
          padding: 24,
          alignItems: 'center',
          marginTop: 6,
        },
      },
      h(
        Text,
        { style: { color: p.textPrimary, fontSize: 15, fontWeight: '700' } },
        'No plugins meet the search criteria.',
      ),
      h(
        Text,
        { style: { color: p.textMuted, fontSize: 13, marginTop: 4 } },
        'Try clearing the query or resetting your status filter.',
      ),
    );

    return h(
      View,
      { style: { flex: 1 } },
      fixedHeader,
      FlatList
        ? h(FlatList, {
            style: { flex: 1 },
            data: sortedAndFiltered,
            extraData: [activeSet, favoriteSet],
            keyExtractor,
            renderItem,
            ListEmptyComponent: emptyView,
            keyboardShouldPersistTaps: 'handled',
            initialNumToRender: 14,
            maxToRenderPerBatch: 16,
            updateCellsBatchingPeriod: 30,
            windowSize: 7,
            removeClippedSubviews: false,
            contentContainerStyle: styles.listContent,
          })
        : h(
            ScrollView,
            {
              style: { flex: 1 },
              keyboardShouldPersistTaps: 'handled',
              contentContainerStyle: styles.listContent,
            },
            sortedAndFiltered.length === 0
              ? emptyView
              : h(
                  React.Fragment,
                  null,
                  ...sortedAndFiltered.map((item: NekocordPlugin) =>
                    h(PluginCard, {
                      key: item.name,
                      plugin: item,
                      enabled: activeSet.has(item.name),
                      favorite: favoriteSet.has(item.name),
                      p,
                      onSelect: ctx.onSelectPlugin,
                      onToggle: ctx.onTogglePlugin,
                    }),
                  ),
                ),
          ),
    );
  }

  function ThemesTabView(ctx: {
    p: Palette;
    subTab: ThemeSubTab;
    themes: NekocordTheme[];
    activeThemeId: string | null;
    themeUrlInput: string;
    cssNameInput: string;
    cssCodeInput: string;
    themeBusy: boolean;
    themeMessage: { text: string; tone: 'success' | 'error' } | null;
    onSubTabChange: (t: ThemeSubTab) => void;
    onThemeUrlChange: (url: string) => void;
    onCssNameChange: (name: string) => void;
    onCssCodeChange: (css: string) => void;
    onLoadCssTemplate: () => void;
    onInstallCssTheme: () => void;
    onInstallTheme: () => void;
    onSelectTheme: (theme: NekocordTheme) => void;
    onResetTheme: () => void;
    onDeleteTheme: (theme: NekocordTheme) => void;
  }) {
    const { p, subTab } = ctx;
    return h(
      React.Fragment,
      null,
      h(
        View,
        {
          style: {
            flexDirection: 'row',
            backgroundColor: p.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: p.border,
            padding: 4,
            marginBottom: 12,
          },
        },
        ...(
          [
            { id: 'local' as const, label: `Installed (${ctx.themes.length})` },
            { id: 'online' as const, label: 'Import / Custom CSS' },
          ]
        ).map((item) => {
          const active = subTab === item.id;
          return h(
            Pressable,
            {
              key: `tt-${item.id}`,
              onPress: () => ctx.onSubTabChange(item.id),
              style: {
                flex: 1,
                paddingVertical: 8,
                borderRadius: 6,
                alignItems: 'center',
                backgroundColor: active ? p.brand : 'transparent',
              },
            },
            h(
              Text,
              {
                style: {
                  color: active ? p.brandOnText : p.textSecondary,
                  fontSize: 13,
                  fontWeight: active ? '700' : '600',
                },
              },
              item.label,
            ),
          );
        }),
      ),
      subTab === 'local'
        ? h(
            React.Fragment,
            null,
            ctx.activeThemeId
              ? renderNoticeCard(
                  {
                    variant: 'brand',
                    title: 'Active Theme Override',
                    body: 'You can switch back to Stock Discord anytime without deleting your installed themes.',
                    iconName: 'paintbrush',
                    actionLabel: 'Reset',
                    actionIcon: 'restart',
                    onAction: ctx.onResetTheme,
                  },
                  p,
                )
              : renderNoticeCard(
                  {
                    variant: 'normal',
                    title: 'Custom Themes Only',
                    body: 'Install a Custom CSS theme or theme JSON URL under Import / Custom CSS, then toggle it here.',
                    iconName: 'paintbrush',
                  },
                  p,
                ),
            ctx.themes.length === 0
              ? h(
                  View,
                  {
                    style: {
                      backgroundColor: p.surface,
                      borderColor: p.border,
                      borderWidth: 1,
                      borderRadius: 10,
                      padding: 20,
                      alignItems: 'center',
                      marginTop: 4,
                    },
                  },
                  h(
                    Text,
                    { style: { color: p.textPrimary, fontSize: 15, fontWeight: '700' } },
                    'No custom themes installed yet.',
                  ),
                  h(
                    Text,
                    {
                      style: {
                        color: p.textMuted,
                        fontSize: 13,
                        textAlign: 'center',
                        marginTop: 5,
                        marginBottom: 14,
                      },
                    },
                    'Paste Discord CSS variables or download a theme JSON / CSS URL to customize Discord.',
                  ),
                  renderButton(
                    {
                      key: 'empty-open-css',
                      label: 'Open Import / Custom CSS',
                      tone: 'brand',
                      iconName: 'plus',
                      onPress: () => ctx.onSubTabChange('online'),
                    },
                    p,
                  ),
                )
              : h(
                  React.Fragment,
                  null,
                  ...ctx.themes.map((theme) =>
                    h(ThemeCard, {
                      key: theme.id,
                      theme,
                      active: ctx.activeThemeId === theme.id,
                      p,
                      onSelect: ctx.onSelectTheme,
                      onDelete: ctx.onDeleteTheme,
                    }),
                  ),
                ),
          )
        : h(
            React.Fragment,
            null,
            renderNoticeCard(
              {
                variant: 'normal',
                title: 'Import JSON or Custom CSS Theme',
                body: 'Install themes from a direct .css / .json URL or write custom Discord CSS variables directly below.',
                iconName: 'link',
              },
              p,
            ),
            h(
              View,
              {
                style: {
                  backgroundColor: p.surface,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: p.border,
                  padding: 14,
                  marginBottom: 12,
                },
              },
              renderSectionHeading('Theme URL (.css or .json)', p, true),
              TextInput
                ? h(TextInput, {
                    value: ctx.themeUrlInput,
                    onChangeText: ctx.onThemeUrlChange,
                    placeholder: 'https://raw.githubusercontent.com/.../theme.css',
                    placeholderTextColor: p.textMuted,
                    autoCapitalize: 'none',
                    autoCorrect: false,
                    style: {
                      backgroundColor: p.surfaceAlt,
                      borderColor: p.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      height: 42,
                      color: p.textPrimary,
                      fontSize: 13,
                      marginBottom: 12,
                    },
                  })
                : null,
              renderButton(
                {
                  key: 'theme-install-btn',
                  label: ctx.themeBusy ? 'Installing...' : 'Download & Install Theme',
                  tone: 'brand',
                  iconName: 'cloudDownload',
                  disabled: ctx.themeBusy,
                  onPress: ctx.onInstallTheme,
                },
                p,
              ),
            ),
            h(
              View,
              {
                style: {
                  backgroundColor: p.surface,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: p.border,
                  padding: 14,
                },
              },
              renderSectionHeading('Custom CSS Theme Editor', p, true),
              TextInput
                ? h(TextInput, {
                    value: ctx.cssNameInput,
                    onChangeText: ctx.onCssNameChange,
                    placeholder: 'Theme name (optional if @name header present)',
                    placeholderTextColor: p.textMuted,
                    autoCapitalize: 'words',
                    style: {
                      backgroundColor: p.surfaceAlt,
                      borderColor: p.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      height: 40,
                      color: p.textPrimary,
                      fontSize: 13,
                      marginBottom: 10,
                    },
                  })
                : null,
              TextInput
                ? h(TextInput, {
                    value: ctx.cssCodeInput,
                    onChangeText: ctx.onCssCodeChange,
                    placeholder: ':root { --background-primary: #1a1826; --brand-500: #d982b5; }',
                    placeholderTextColor: p.textMuted,
                    multiline: true,
                    textAlignVertical: 'top',
                    autoCapitalize: 'none',
                    autoCorrect: false,
                    style: {
                      backgroundColor: p.surfaceAlt,
                      borderColor: p.border,
                      borderWidth: 1,
                      borderRadius: 8,
                      padding: 11,
                      minHeight: 130,
                      color: p.textPrimary,
                      fontSize: 12.5,
                      fontFamily: 'monospace',
                      marginBottom: 12,
                    },
                  })
                : null,
              h(
                View,
                { style: { flexDirection: 'row', justifyContent: 'space-between' } },
                h(
                  View,
                  { style: { flex: 1, marginRight: 5 } },
                  renderButton(
                    {
                      key: 'css-load-template',
                      label: 'Template',
                      tone: 'secondary',
                      iconName: 'copy',
                      onPress: ctx.onLoadCssTemplate,
                    },
                    p,
                  ),
                ),
                h(
                  View,
                  { style: { flex: 1.5, marginLeft: 5 } },
                  renderButton(
                    {
                      key: 'css-save-btn',
                      label: 'Save CSS Theme',
                      tone: 'brand',
                      iconName: 'plus',
                      onPress: ctx.onInstallCssTheme,
                    },
                    p,
                  ),
                ),
              ),
              ctx.themeMessage
                ? h(
                    Text,
                    {
                      style: {
                        color: ctx.themeMessage.tone === 'success' ? p.success : p.warning,
                        fontSize: 12.5,
                        marginTop: 6,
                      },
                    },
                    ctx.themeMessage.text,
                  )
                : null,
            ),
          ),
    );
  }

  function NotificationsTabView(ctx: {
    p: Palette;
    entries: NekocordNotificationEntry[];
    filter: NotificationFilter;
    onFilterChange: (f: NotificationFilter) => void;
    onToggleSetting: (key: 'enabled' | 'showToasts' | 'captureMentions' | 'captureRelationships') => void;
    onSendTest: () => void;
    onDeleteEntry: (id: string) => void;
    onClearAll: () => void;
  }) {
    const { p, entries, filter } = ctx;
    const settings = getNotificationSettings();

    const filtered = entries.filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'discord') return item.kind === 'discord' || item.source === 'Discord';
      if (filter === 'alerts') return item.kind === 'warning' || item.kind === 'error';
      return item.kind !== 'discord';
    });

    const formatTime = (ts: number) => {
      const d = new Date(ts);
      const hh = d.getHours() < 10 ? `0${d.getHours()}` : String(d.getHours());
      const mm = d.getMinutes() < 10 ? `0${d.getMinutes()}` : String(d.getMinutes());
      const ss = d.getSeconds() < 10 ? `0${d.getSeconds()}` : String(d.getSeconds());
      return `${hh}:${mm}:${ss}`;
    };

    const getAccent = (kind: NekocordNotificationEntry['kind']) => {
      switch (kind) {
        case 'success':
          return p.success;
        case 'warning':
          return p.warning;
        case 'error':
          return p.danger;
        case 'discord':
          return '#c084fc';
        default:
          return p.brand;
      }
    };

    const toggleItems: Array<{
      key: 'enabled' | 'showToasts' | 'captureMentions' | 'captureRelationships';
      label: string;
      desc: string;
      val: boolean;
    }> = [
      {
        key: 'enabled',
        label: 'Enable Notification Log',
        desc: 'Record Nekocord events, alerts, and plugin logs locally.',
        val: settings.enabled,
      },
      {
        key: 'showToasts',
        label: 'Show In-App Toast Banners',
        desc: 'Display non-blocking floating toast banners inside Discord.',
        val: settings.showToasts,
      },
      {
        key: 'captureMentions',
        label: 'Capture Mentions & DMs',
        desc: 'Log incoming direct messages and pings mentioning your account.',
        val: settings.captureMentions,
      },
      {
        key: 'captureRelationships',
        label: 'Capture Relationship Alerts',
        desc: 'Record incoming friend requests and friend list removals.',
        val: settings.captureRelationships,
      },
    ];

    const filters: Array<{ id: NotificationFilter; label: string }> = [
      { id: 'all', label: `All (${entries.length})` },
      { id: 'nekocord', label: 'Nekocord' },
      { id: 'discord', label: 'Discord' },
      { id: 'alerts', label: 'Alerts' },
    ];

    return h(
      React.Fragment,
      null,
      renderSectionHeading('Notification Settings', p, true),
      renderGroupedCard(
        toggleItems.map((item) =>
          h(
            View,
            {
              key: `nf-${item.key}`,
              style: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 14,
                paddingVertical: 11,
              },
            },
            h(
              View,
              { style: { flex: 1, paddingRight: 12 } },
              h(Text, { style: { color: p.textPrimary, fontSize: 14.5, fontWeight: '600' } }, item.label),
              h(Text, { style: { color: p.textMuted, fontSize: 12, marginTop: 2 } }, item.desc),
            ),
            h(DiscordSwitch, {
              value: item.val,
              p,
              accessibilityLabel: item.label,
              onValueChange: () => ctx.onToggleSetting(item.key),
            }),
          ),
        ),
        p,
      ),
      h(
        View,
        { style: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 } },
        h(
          View,
          { style: { flex: 1, marginRight: 5 } },
          renderButton(
            {
              key: 'nf-test',
              label: 'Test Notification',
              tone: 'brand',
              iconName: 'log',
              onPress: ctx.onSendTest,
            },
            p,
          ),
        ),
        h(
          View,
          { style: { flex: 1, marginLeft: 5 } },
          renderButton(
            {
              key: 'nf-clear',
              label: 'Clear Log',
              tone: 'danger',
              iconName: 'delete',
              disabled: entries.length === 0,
              onPress: ctx.onClearAll,
            },
            p,
          ),
        ),
      ),
      h(
        View,
        { style: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, marginBottom: 10 } },
        ...filters.map((f) => {
          const active = filter === f.id;
          return h(
            Pressable,
            {
              key: `nf-flt-${f.id}`,
              onPress: () => ctx.onFilterChange(f.id),
              style: [
                styles.filterChip,
                {
                  backgroundColor: active ? p.brand : p.surface,
                  borderColor: active ? p.brand : p.border,
                  marginTop: 6,
                },
              ],
            },
            h(
              Text,
              {
                style: {
                  color: active ? p.brandOnText : p.textSecondary,
                  fontSize: 12,
                  fontWeight: active ? '700' : '600',
                },
              },
              f.label,
            ),
          );
        }),
      ),
      filtered.length === 0
        ? h(
            View,
            {
              style: {
                backgroundColor: p.surface,
                borderColor: p.border,
                borderWidth: 1,
                borderRadius: 10,
                padding: 22,
                alignItems: 'center',
              },
            },
            h(Text, { style: { color: p.textPrimary, fontSize: 15, fontWeight: '700' } }, 'No notifications yet.'),
            h(
              Text,
              { style: { color: p.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4 } },
              'Plugin events, mentions, and alerts will appear here in chronological order.',
            ),
          )
        : h(
            React.Fragment,
            null,
            ...filtered.map((item) => {
              const accent = getAccent(item.kind);
              return h(
                View,
                {
                  key: item.id,
                  style: [
                    styles.addonCard,
                    {
                      backgroundColor: p.surface,
                      borderColor: p.border,
                      borderLeftWidth: 3.5,
                      borderLeftColor: accent,
                    },
                  ],
                },
                h(
                  View,
                  { style: styles.addonHeader },
                  h(
                    View,
                    { style: styles.addonTitleWrap },
                    h(
                      Text,
                      { numberOfLines: 1, style: { color: p.textPrimary, fontSize: 14.5, fontWeight: '700' } },
                      item.title,
                    ),
                    h(
                      View,
                      { style: { flexDirection: 'row', alignItems: 'center', marginTop: 2 } },
                      h(
                        Text,
                        { style: { color: accent, fontSize: 11, fontWeight: '700', marginRight: 8 } },
                        item.source,
                      ),
                      h(
                        Text,
                        { style: { color: p.textMuted, fontSize: 11 } },
                        formatTime(item.timestamp),
                      ),
                    ),
                  ),
                  h(
                    Pressable,
                    {
                      onPress: () => ctx.onDeleteEntry(item.id),
                      hitSlop: 8,
                      style: [styles.iconButton, { backgroundColor: p.surfaceAlt, marginRight: 0 }],
                    },
                    icon('delete', 15, p.textMuted),
                  ),
                ),
                h(
                  Text,
                  { style: { color: p.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 6 } },
                  item.body,
                ),
              );
            }),
          ),
    );
  }

  function ImportPluginView(ctx: {
    p: Palette;
    urlInput: string;
    nameInput: string;
    codeInput: string;
    busy: boolean;
    message: { text: string; tone: 'success' | 'error' } | null;
    onUrlChange: (v: string) => void;
    onNameChange: (v: string) => void;
    onCodeChange: (v: string) => void;
    onLoadExample: () => void;
    onImportUrl: () => void;
    onImportCode: () => void;
  }) {
    const { p } = ctx;
    return h(
      React.Fragment,
      null,
      renderNoticeCard(
        {
          variant: 'normal',
          title: 'Import Custom Plugin',
          body: 'Install a Nekocord JavaScript plugin directly from an HTTPS URL or paste JS source using definePlugin / Nekocord APIs.',
          iconName: 'plugins',
        },
        p,
      ),
      h(
        View,
        {
          style: {
            backgroundColor: p.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: p.border,
            padding: 14,
            marginBottom: 12,
          },
        },
        renderSectionHeading('Import From URL', p, true),
        TextInput
          ? h(TextInput, {
              value: ctx.urlInput,
              onChangeText: ctx.onUrlChange,
              placeholder: 'https://raw.githubusercontent.com/.../plugin.js',
              placeholderTextColor: p.textMuted,
              autoCapitalize: 'none',
              autoCorrect: false,
              style: {
                backgroundColor: p.surfaceAlt,
                borderColor: p.border,
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 42,
                color: p.textPrimary,
                fontSize: 13,
                marginBottom: 12,
              },
            })
          : null,
        renderButton(
          {
            key: 'pl-import-url',
            label: ctx.busy ? 'Fetching Plugin...' : 'Download & Install Plugin',
            tone: 'brand',
            iconName: 'cloudDownload',
            disabled: ctx.busy,
            onPress: ctx.onImportUrl,
          },
          p,
        ),
      ),
      h(
        View,
        {
          style: {
            backgroundColor: p.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: p.border,
            padding: 14,
          },
        },
        renderSectionHeading('Paste Plugin JavaScript', p, true),
        TextInput
          ? h(TextInput, {
              value: ctx.nameInput,
              onChangeText: ctx.onNameChange,
              placeholder: 'Plugin name (optional if // @name present)',
              placeholderTextColor: p.textMuted,
              autoCapitalize: 'none',
              autoCorrect: false,
              style: {
                backgroundColor: p.surfaceAlt,
                borderColor: p.border,
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 40,
                color: p.textPrimary,
                fontSize: 13,
                marginBottom: 10,
              },
            })
          : null,
        TextInput
          ? h(TextInput, {
              value: ctx.codeInput,
              onChangeText: ctx.onCodeChange,
              placeholder: '// @name MyPlugin\nexport default definePlugin({ start() {}, stop() {} });',
              placeholderTextColor: p.textMuted,
              multiline: true,
              textAlignVertical: 'top',
              autoCapitalize: 'none',
              autoCorrect: false,
              style: {
                backgroundColor: p.surfaceAlt,
                borderColor: p.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 11,
                minHeight: 150,
                color: p.textPrimary,
                fontSize: 12,
                fontFamily: 'monospace',
                marginBottom: 12,
              },
            })
          : null,
        h(
          View,
          { style: { flexDirection: 'row', justifyContent: 'space-between' } },
          h(
            View,
            { style: { flex: 1, marginRight: 5 } },
            renderButton(
              {
                key: 'pl-example',
                label: 'Example',
                tone: 'secondary',
                iconName: 'copy',
                onPress: ctx.onLoadExample,
              },
              p,
            ),
          ),
          h(
            View,
            { style: { flex: 1.6, marginLeft: 5 } },
            renderButton(
              {
                key: 'pl-install-code',
                label: 'Install & Enable',
                tone: 'brand',
                iconName: 'plus',
                onPress: ctx.onImportCode,
              },
              p,
            ),
          ),
        ),
        ctx.message
          ? h(
              Text,
              {
                style: {
                  color: ctx.message.tone === 'success' ? p.success : p.warning,
                  fontSize: 12.5,
                  marginTop: 8,
                },
              },
              ctx.message.text,
            )
          : null,
      ),
    );
  }

  function UpdaterTabView(ctx: {
    p: Palette;
    version: string;
    updateSourceInput: string;
    updateBusy: boolean;
    updateMessage: string | null;
    updateResult: UpdateCheckResult | null;
    onUpdateSourceChange: (value: string) => void;
    onCheckUpdates: () => void;
    onInstallUpdate: () => void;
    onOpenRelease: () => void;
    onOpenRepo: () => void;
    onRestartApp: () => void;
  }) {
    const { p, updateResult } = ctx;

    return h(
      React.Fragment,
      null,
      renderSectionHeading('Repo', p, true),
      h(
        Pressable,
        {
          onPress: ctx.onOpenRepo,
          style: {
            backgroundColor: p.surface,
            borderColor: p.border,
            borderWidth: 1,
            borderRadius: 8,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
        },
        h(
          View,
          { style: { flexDirection: 'row', alignItems: 'center', flex: 1 } },
          icon('github', 20, p.textPrimary),
          h(
            View,
            { style: { marginLeft: 10, flex: 1 } },
            h(
              Text,
              { style: { color: p.textPrimary, fontSize: 14.5, fontWeight: '700' } },
              DEFAULT_UPDATE_SOURCE,
            ),
            h(
              Text,
              { style: { color: p.textMuted, fontSize: 12, marginTop: 1 } },
              `Installed: Nekocord v${ctx.version}`,
            ),
          ),
        ),
        icon('openExternal', 17, p.textSecondary),
      ),

      renderSectionHeading('Update Source', p),
      h(
        View,
        {
          style: {
            backgroundColor: p.surface,
            borderColor: p.border,
            borderWidth: 1,
            borderRadius: 8,
            padding: 14,
          },
        },
        h(
          Text,
          { style: { color: p.textSecondary, fontSize: 12.5, marginBottom: 8 } },
          'GitHub owner/repo shorthand or custom manifest/bundle HTTPS URL',
        ),
        TextInput
          ? h(TextInput, {
              value: ctx.updateSourceInput,
              onChangeText: ctx.onUpdateSourceChange,
              placeholder: DEFAULT_UPDATE_SOURCE,
              placeholderTextColor: p.textMuted,
              autoCapitalize: 'none',
              autoCorrect: false,
              style: {
                backgroundColor: p.surfaceAlt,
                borderColor: p.border,
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                height: 40,
                color: p.textPrimary,
                fontSize: 13,
                marginBottom: 12,
              },
            })
          : null,
        h(
          View,
          { style: { flexDirection: 'row', flexWrap: 'wrap' } },
          renderButton(
            {
              key: 'up-check',
              label: ctx.updateBusy ? 'Checking...' : 'Check for Updates',
              tone: 'brand',
              iconName: 'updater',
              disabled: ctx.updateBusy,
              onPress: ctx.onCheckUpdates,
            },
            p,
          ),
          updateResult?.bundleUrl
            ? renderButton(
                {
                  key: 'up-install',
                  label: ctx.updateBusy ? 'Downloading...' : 'Update Now',
                  tone: 'success',
                  iconName: 'cloudDownload',
                  disabled: ctx.updateBusy,
                  onPress: ctx.onInstallUpdate,
                },
                p,
              )
            : null,
          updateResult?.releaseUrl
            ? renderButton(
                {
                  key: 'up-open',
                  label: 'Release Page',
                  tone: 'secondary',
                  iconName: 'openExternal',
                  onPress: ctx.onOpenRelease,
                },
                p,
              )
            : null,
          renderButton(
            {
              key: 'up-restart',
              label: 'Restart Discord',
              tone: 'secondary',
              iconName: 'restart',
              onPress: ctx.onRestartApp,
            },
            p,
          ),
        ),
      ),

      renderSectionHeading('Updates', p),
      updateResult
        ? renderNoticeCard(
            {
              variant:
                updateResult.status === 'update-available'
                  ? 'brand'
                  : updateResult.status === 'error'
                    ? 'warning'
                    : 'success',
              title:
                updateResult.status === 'update-available'
                  ? `Update available: v${updateResult.latestVersion ?? ctx.version}`
                  : updateResult.status === 'error'
                    ? 'Update Check Failed'
                    : 'Up to date!',
              body:
                ctx.updateMessage ??
                `You are running the latest version (v${ctx.version}).`,
              iconName:
                updateResult.status === 'update-available' ? 'cloudDownload' : 'updater',
            },
            p,
          )
        : renderNoticeCard(
            {
              variant: 'normal',
              title: 'Ready to check',
              body: ctx.updateMessage ?? 'Tap "Check for Updates" to query GitHub Releases for newer runtime bundles.',
              iconName: 'info',
            },
            p,
          ),
      updateResult?.notes
        ? h(
            View,
            {
              style: {
                backgroundColor: p.surface,
                borderColor: p.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 13,
              },
            },
            h(
              Text,
              { style: { color: p.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 6 } },
              'Release Notes',
            ),
            h(
              Text,
              { style: { color: p.textSecondary, fontSize: 12.5, lineHeight: 18 } },
              updateResult.notes,
            ),
          )
        : null,
    );
  }

  function BackupTabView(ctx: {
    p: Palette;
    importInput: string;
    exportPreview: string | null;
    backupNotice: { text: string; tone: 'success' | 'error' } | null;
    onImportInputChange: (val: string) => void;
    onExportSettings: () => void;
    onImportSettings: () => void;
    onRequestReset: () => void;
  }) {
    const { p } = ctx;
    return h(
      React.Fragment,
      null,
      renderNoticeCard(
        {
          variant: 'warning',
          title: 'Warning',
          body: 'Importing a settings backup will overwrite your current plugin, favorite, and theme configuration.',
          iconName: 'safety',
        },
        p,
      ),

      h(
        View,
        {
          style: {
            backgroundColor: p.surface,
            borderColor: p.border,
            borderWidth: 1,
            borderRadius: 8,
            padding: 14,
            marginBottom: 12,
          },
        },
        h(
          Text,
          { style: { color: p.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 10 } },
          'You can export and restore your Nekocord configuration as portable JSON to transfer across devices or recover after a reinstall.',
        ),
        h(
          Text,
          { style: { color: p.textPrimary, fontSize: 13.5, fontWeight: '700', marginBottom: 6 } },
          'Settings Export contains:',
        ),
        ...[
          'Enabled & Disabled Plugin Overrides',
          'Starred Favorite Plugins',
          'Active Theme & Installed Custom Themes',
          'Configured OTA Update Source',
        ].map((line, i) =>
          h(
            Text,
            { key: `bk-li-${i}`, style: { color: p.textSecondary, fontSize: 12.5, lineHeight: 19 } },
            `\u2014 ${line}`,
          ),
        ),
      ),

      h(
        View,
        { style: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 } },
        renderButton(
          {
            key: 'bk-export',
            label: 'Export Settings',
            tone: 'brand',
            iconName: 'copy',
            onPress: ctx.onExportSettings,
          },
          p,
        ),
        renderButton(
          {
            key: 'bk-reset',
            label: 'Reset to Defaults',
            tone: 'danger',
            iconName: 'delete',
            onPress: ctx.onRequestReset,
          },
          p,
        ),
      ),

      ctx.backupNotice
        ? renderNoticeCard(
            {
              variant: ctx.backupNotice.tone === 'success' ? 'success' : 'danger',
              title: ctx.backupNotice.tone === 'success' ? 'Done' : 'Error',
              body: ctx.backupNotice.text,
              iconName: 'backupRestore',
            },
            p,
          )
        : null,

      ctx.exportPreview
        ? h(
            View,
            {
              style: {
                backgroundColor: p.surface,
                borderColor: p.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
              },
            },
            h(
              Text,
              { style: { color: p.textPrimary, fontSize: 12.5, fontWeight: '700', marginBottom: 6 } },
              'Exported JSON Snapshot (copied to clipboard)',
            ),
            h(
              Text,
              {
                selectable: true,
                numberOfLines: 8,
                style: {
                  color: p.textSecondary,
                  fontSize: 11.5,
                  fontFamily: 'monospace',
                  lineHeight: 16,
                },
              },
              ctx.exportPreview,
            ),
          )
        : null,

      renderSectionHeading('Import Settings', p),
      h(
        View,
        {
          style: {
            backgroundColor: p.surface,
            borderColor: p.border,
            borderWidth: 1,
            borderRadius: 8,
            padding: 14,
          },
        },
        TextInput
          ? h(TextInput, {
              value: ctx.importInput,
              onChangeText: ctx.onImportInputChange,
              placeholder: 'Paste exported Nekocord settings JSON here...',
              placeholderTextColor: p.textMuted,
              multiline: true,
              textAlignVertical: 'top',
              autoCapitalize: 'none',
              autoCorrect: false,
              style: {
                backgroundColor: p.surfaceAlt,
                borderColor: p.border,
                borderWidth: 1,
                borderRadius: 8,
                padding: 12,
                minHeight: 110,
                color: p.textPrimary,
                fontSize: 12.5,
                fontFamily: 'monospace',
                marginBottom: 12,
              },
            })
          : null,
        renderButton(
          {
            key: 'bk-import',
            label: 'Import Settings',
            tone: 'brand',
            iconName: 'cloudDownload',
            onPress: ctx.onImportSettings,
          },
          p,
        ),
      ),
    );
  }

  const ModalToastHost = createNekocordToastHost(React, ReactNative, { inModal: true });

  function NekocordOverlay() {
    const [isOpen, setIsOpen]: [boolean, (v: boolean) => void] = React.useState(modalVisible);
    const [navStack, setNavStack]: [
      NekocordRoute[],
      (updater: NekocordRoute[] | ((prev: NekocordRoute[]) => NekocordRoute[])) => void,
    ] = React.useState(() => [{ kind: 'page', tab: requestedTab }]);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all' as PluginStatusFilter);
    const [categoryFilter, setCategoryFilter] = React.useState('all' as PluginCategoryFilter);
    const [pendingRestartNames, setPendingRestartNames] = React.useState([] as string[]);
    const [restartPrompt, setRestartPrompt] = React.useState(
      null as { label: string; nextState: string } | null,
    );
    const [restartNotice, setRestartNotice] = React.useState(null as string | null);
    const [themeSubTab, setThemeSubTab] = React.useState('local' as ThemeSubTab);
    const [themeUrlInput, setThemeUrlInput] = React.useState('');
    const [cssNameInput, setCssNameInput] = React.useState('');
    const [cssCodeInput, setCssCodeInput] = React.useState('');
    const [themeBusy, setThemeBusy] = React.useState(false);
    const [themeMessage, setThemeMessage] = React.useState(
      null as { text: string; tone: 'success' | 'error' } | null,
    );
    const [pluginImportUrl, setPluginImportUrl] = React.useState('');
    const [pluginImportName, setPluginImportName] = React.useState('');
    const [pluginImportCode, setPluginImportCode] = React.useState('');
    const [pluginImportBusy, setPluginImportBusy] = React.useState(false);
    const [pluginImportMessage, setPluginImportMessage] = React.useState(
      null as { text: string; tone: 'success' | 'error' } | null,
    );
    const [notifFilter, setNotifFilter] = React.useState('all' as NotificationFilter);
    const [updateSourceInput, setUpdateSourceInput] = React.useState(() => getUpdateSource());
    const [updateBusy, setUpdateBusy] = React.useState(false);
    const [updateMessage, setUpdateMessage] = React.useState(null as string | null);
    const [updateResult, setUpdateResult] = React.useState(null as UpdateCheckResult | null);
    const [importInput, setImportInput] = React.useState('');
    const [exportPreview, setExportPreview] = React.useState(null as string | null);
    const [backupNotice, setBackupNotice] = React.useState(
      null as { text: string; tone: 'success' | 'error' } | null,
    );
    const [confirmReset, setConfirmReset] = React.useState(false);
    const [settingsTick, setSettingsTick] = React.useState(0);
    const [pluginTick, setPluginTick] = React.useState(0);
    const [notifTick, setNotifTick] = React.useState(0);

    React.useEffect(() => {
      const onModalToggle = (nextOpen: boolean, nextTab: NekocordTab) => {
        setIsOpen(nextOpen);
        if (nextOpen) {
          setNavStack([{ kind: 'page', tab: nextTab }]);
          setUpdateSourceInput(getUpdateSource());
        }
      };
      modalListeners.add(onModalToggle);
      const unsubscribe = subscribeSettings(() => {
        setSettingsTick((n: number) => n + 1);
      });
      const unsubscribeNotifs = subscribeNotifications(() => {
        setNotifTick((n: number) => n + 1);
      });
      const unsubscribePlugins = globalThis.Nekocord?.subscribePlugins?.(() => {
        setPluginTick((n: number) => n + 1);
      });
      return () => {
        modalListeners.delete(onModalToggle);
        unsubscribe();
        unsubscribeNotifs();
        unsubscribePlugins?.();
      };
    }, []);

    const currentRoute: NekocordRoute =
      navStack[navStack.length - 1] ?? { kind: 'page', tab: requestedTab };
    const activeTab: NekocordTab =
      currentRoute.kind === 'page' ? currentRoute.tab : 'plugins';
    const selectedPluginName: string | null =
      currentRoute.kind === 'plugin' ? currentRoute.pluginName : null;
    const isImportingPlugin = currentRoute.kind === 'import-plugin';

    const nekocord = globalThis.Nekocord;
    const isLight = getStore<{ theme?: string }>('ThemeStore')?.theme === 'light';
    const activeTheme = getActiveTheme();
    const p = React.useMemo(() => getActivePalette(isLight), [isLight, activeTheme]);

    const visiblePlugins = React.useMemo(
      () => Array.from(nekocord?.plugins.values() ?? []).filter((pl) => !pl.core),
      [nekocord, pluginTick],
    );

    const notificationEntries = React.useMemo(
      () => getNotificationLog(),
      [notifTick, isOpen],
    );

    const activeSet: ReadonlySet<string> = React.useMemo(
      () => nekocord?.getActivePlugins() ?? new Set<string>(),
      [nekocord, settingsTick],
    );

    const favoriteSet: ReadonlySet<string> = React.useMemo(
      () => new Set(getFavoritePlugins()),
      [settingsTick],
    );

    const activeVisibleCount = React.useMemo(() => {
      let count = 0;
      for (let i = 0; i < visiblePlugins.length; i += 1) {
        if (activeSet.has(visiblePlugins[i].name)) {
          count += 1;
        }
      }
      return count;
    }, [visiblePlugins, activeSet]);

    const handleBack = React.useCallback(() => {
      if (navStack.length > 1) {
        setNavStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
        return;
      }
      closeNekocordSettings();
    }, [navStack.length]);

    const handlePushPage = React.useCallback((tab: NekocordTab) => {
      setNavStack((prev) => [...prev, { kind: 'page', tab }]);
    }, []);

    const queueRestartPrompt = React.useCallback((label: string, nextState: string) => {
      setPendingRestartNames((prev: string[]) => (prev.includes(label) ? prev : [...prev, label]));
      setRestartNotice(null);
      setRestartPrompt({ label, nextState });
    }, []);

    const handleTogglePlugin = React.useCallback(
      (plugin: NekocordPlugin) => {
        if (plugin.core) return;
        const wasEnabled = nekocord?.getActivePlugins().has(plugin.name) ?? false;
        nekocord?.togglePlugin(plugin.name);
        if (plugin.requiresRestart) {
          queueRestartPrompt(plugin.name, wasEnabled ? 'disabled' : 'enabled');
        }
      },
      [nekocord, queueRestartPrompt],
    );

    const handleToggleQuickSwitch = React.useCallback(
      (pluginName: string) => {
        const plugin = nekocord?.plugins.get(pluginName);
        if (plugin) {
          handleTogglePlugin(plugin);
        }
      },
      [nekocord, handleTogglePlugin],
    );

    const handleToggleFavorite = React.useCallback((plugin: NekocordPlugin) => {
      toggleFavoritePlugin(plugin.name);
    }, []);

    const handleOpenPluginGithub = React.useCallback((plugin: NekocordPlugin) => {
      if (plugin.imported && plugin.sourceUrl) {
        openReleasePage(plugin.sourceUrl);
        return;
      }
      openReleasePage(
        `https://github.com/${DEFAULT_UPDATE_SOURCE}/tree/main/runtime/src/plugins/${plugin.slug}`,
      );
    }, []);

    const handleOpenImportPlugin = React.useCallback(() => {
      setPluginImportMessage(null);
      setNavStack((prev) => [...prev, { kind: 'import-plugin' }]);
    }, []);

    const handleImportPluginUrl = React.useCallback(async () => {
      if (!nekocord) return;
      setPluginImportBusy(true);
      setPluginImportMessage(null);
      const res = await nekocord.importPluginFromUrl(pluginImportUrl);
      setPluginImportBusy(false);
      if (res.ok && res.plugin) {
        setPluginImportUrl('');
        setPluginImportMessage({ text: `${res.message} Enabled now.`, tone: 'success' });
      } else {
        setPluginImportMessage({ text: res.message, tone: 'error' });
      }
    }, [nekocord, pluginImportUrl]);

    const handleImportPluginCode = React.useCallback(() => {
      if (!nekocord) return;
      const res = nekocord.importPluginFromCode(pluginImportCode, pluginImportName);
      if (res.ok && res.plugin) {
        setPluginImportName('');
        setPluginImportMessage({ text: `${res.message} Enabled now.`, tone: 'success' });
      } else {
        setPluginImportMessage({ text: res.message, tone: 'error' });
      }
    }, [nekocord, pluginImportCode, pluginImportName]);

    const handleUninstallPlugin = React.useCallback(
      (plugin: NekocordPlugin) => {
        if (!plugin.imported) return;
        const ok = nekocord?.uninstallCustomPlugin(plugin.name);
        if (ok) {
          setNavStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
        }
      },
      [nekocord],
    );

    const handleOpenRepo = React.useCallback(() => {
      openReleasePage(`https://github.com/${DEFAULT_UPDATE_SOURCE}`);
    }, []);

    const handleSelectPlugin = React.useCallback((plugin: NekocordPlugin) => {
      setNavStack((prev) => [...prev, { kind: 'plugin', pluginName: plugin.name }]);
    }, []);

    const handleSettingChanged = React.useCallback(
      (plugin: NekocordPlugin, _key: string, restartNeeded?: boolean) => {
        if (restartNeeded || plugin.requiresRestart) {
          queueRestartPrompt(plugin.name, 'updated');
        }
      },
      [queueRestartPrompt],
    );

    const handleResetPluginSettings = React.useCallback((plugin: NekocordPlugin) => {
      resetPluginSettings(plugin.name);
      plugin.settings?.reset?.();
    }, []);

    const handleRestartNow = React.useCallback(() => {
      const ok = restartDiscordApp();
      if (!ok) {
        setRestartNotice(
          'Native reload is unavailable in this session. Please close and reopen Nekocord.',
        );
      }
    }, []);

    const handleClearHistory = React.useCallback(() => {
      clearInlineMessageHistory();
      setSettingsTick((n: number) => n + 1);
    }, []);

    const handleSelectTheme = React.useCallback(
      (theme: NekocordTheme) => {
        const currentlyActive = getActiveThemeId() === theme.id;
        const chosen = selectTheme(currentlyActive ? null : theme.id);
        queueRestartPrompt(
          chosen ? `${chosen.name} theme` : 'Default theme',
          chosen ? 'selected' : 'restored',
        );
      },
      [queueRestartPrompt],
    );

    const handleResetTheme = React.useCallback(() => {
      selectTheme(null);
      queueRestartPrompt('Default theme', 'restored');
    }, [queueRestartPrompt]);

    const handleInstallTheme = React.useCallback(async () => {
      setThemeBusy(true);
      setThemeMessage(null);
      const result = await installThemeFromUrl(themeUrlInput);
      setThemeBusy(false);
      if (result.ok && result.theme) {
        setThemeUrlInput('');
        setThemeMessage({ text: `Installed theme "${result.theme.name}".`, tone: 'success' });
      } else {
        setThemeMessage({
          text: result.error ?? 'Could not install theme.',
          tone: 'error',
        });
      }
    }, [themeUrlInput]);

    const handleInstallCssTheme = React.useCallback(() => {
      setThemeMessage(null);
      const result = installThemeFromCss(cssCodeInput, cssNameInput);
      if (result.ok && result.theme) {
        setCssNameInput('');
        setThemeMessage({ text: `Saved CSS theme "${result.theme.name}".`, tone: 'success' });
      } else {
        setThemeMessage({
          text: result.error ?? 'Could not save CSS theme.',
          tone: 'error',
        });
      }
    }, [cssCodeInput, cssNameInput]);

    const handleToggleNotificationSetting = React.useCallback(
      (key: 'enabled' | 'showToasts' | 'captureMentions' | 'captureRelationships') => {
        const cur = getNotificationSettings();
        updateNotificationSettings({ [key]: !cur[key] });
        setNotifTick((n: number) => n + 1);
      },
      [],
    );

    const handleSendTestNotification = React.useCallback(() => {
      pushNotification({
        title: 'Nekocord Notification Log',
        body: 'Notifications and floating toast banners are working.',
        source: 'Nekocord',
        kind: 'info',
        showToast: true,
      });
    }, []);

    const handleDeleteTheme = React.useCallback((theme: NekocordTheme) => {
      deleteCustomTheme(theme.id);
      setThemeMessage({ text: `Removed "${theme.name}".`, tone: 'success' });
    }, []);

    const handleUpdateSourceChange = React.useCallback((val: string) => {
      setUpdateSourceInput(val);
      setUpdateSource(val.trim() || DEFAULT_UPDATE_SOURCE);
    }, []);

    const handleCheckUpdates = React.useCallback(async () => {
      setUpdateBusy(true);
      setUpdateMessage('Checking for updates...');
      const res = await checkForUpdates(updateSourceInput);
      setUpdateBusy(false);
      setUpdateResult(res);
      if (res.status === 'error') {
        setUpdateMessage(res.error ?? 'Failed to check for updates.');
      } else if (res.status === 'update-available') {
        setUpdateMessage(`Update available: v${res.latestVersion ?? res.currentVersion}`);
      } else {
        setUpdateMessage(`Nekocord v${res.currentVersion} is up to date.`);
      }
    }, [updateSourceInput]);

    const handleCheckUpdatesAndOpen = React.useCallback(() => {
      handlePushPage('updater');
      void handleCheckUpdates();
    }, [handlePushPage, handleCheckUpdates]);

    const handleInstallUpdate = React.useCallback(async () => {
      if (!updateResult) return;
      setUpdateBusy(true);
      setUpdateMessage('Downloading update bundle...');
      const res = await applyRuntimeUpdate(updateResult);
      setUpdateBusy(false);
      setUpdateMessage(res.message);
      if (res.ok) {
        queueRestartPrompt(`Nekocord v${updateResult.latestVersion ?? '1.3.0'}`, 'downloaded');
      }
    }, [updateResult, queueRestartPrompt]);

    const handleOpenRelease = React.useCallback(() => {
      if (updateResult?.releaseUrl) {
        openReleasePage(updateResult.releaseUrl);
      }
    }, [updateResult]);

    const handleExportSettings = React.useCallback(() => {
      const json = exportSettingsJson();
      setExportPreview(json);
      try {
        getClipboardModule()?.setItem(json);
        setBackupNotice({
          text: `Copied settings backup (${json.length} bytes) to clipboard.`,
          tone: 'success',
        });
      } catch {
        setBackupNotice({
          text: 'Generated settings snapshot below (clipboard module unavailable).',
          tone: 'success',
        });
      }
    }, []);

    const handleImportSettings = React.useCallback(() => {
      const result = importSettingsJson(importInput);
      if (!result.ok) {
        setBackupNotice({ text: result.message, tone: 'error' });
        return;
      }
      nekocord?.reconcileSettings?.();
      setImportInput('');
      setBackupNotice({ text: result.message, tone: 'success' });

      const changedRestart = (result.changedPlugins ?? []).filter(
        (name) => nekocord?.plugins.get(name)?.requiresRestart,
      );
      if (changedRestart.length > 0) {
        queueRestartPrompt(
          changedRestart.slice(0, 2).join(', '),
          'imported',
        );
      }
    }, [importInput, nekocord, queueRestartPrompt]);

    const handleConfirmReset = React.useCallback(() => {
      setConfirmReset(false);
      resetSettings();
      nekocord?.reconcileSettings?.();
      setExportPreview(null);
      setBackupNotice({ text: 'Reset all Nekocord settings to defaults.', tone: 'success' });
      queueRestartPrompt('Default settings', 'restored');
    }, [nekocord, queueRestartPrompt]);

    if (!isOpen) {
      return null;
    }

    const version = nekocord?.version ?? '1.4.0';
    const tagline = nekocord?.tagline ?? 'Your cutest Discord client on mobile';
    const selectedPlugin =
      selectedPluginName && !nekocord?.plugins.get(selectedPluginName)?.core
        ? nekocord?.plugins.get(selectedPluginName) ?? null
        : null;
    const allThemes = getAllThemes();
    const activeThemeId = getActiveThemeId();

    const titleMap: Record<NekocordTab, string> = {
      overview: 'Nekocord',
      plugins: 'Plugins',
      themes: 'Themes',
      notifications: 'Notification Log',
      updater: 'Updater',
      backup: 'Backup & Restore',
    };
    const headerTitle = selectedPlugin
      ? selectedPlugin.name
      : isImportingPlugin
        ? 'Import Plugin'
        : titleMap[activeTab];

    return h(
      Modal,
      {
        visible: isOpen,
        animationType: 'slide',
        transparent: false,
        onRequestClose: handleBack,
      },
      h(
        View,
        { style: [styles.root, { backgroundColor: p.canvas }] },
        h(
          View,
          {
            style: [
              styles.topBar,
              { backgroundColor: p.headerBg, borderBottomColor: p.divider },
            ],
          },
          h(
            View,
            { style: styles.topBarLeft },
            h(
              Pressable,
              {
                onPress: handleBack,
                accessible: true,
                accessibilityRole: 'button',
                accessibilityLabel: navStack.length > 1 ? 'Back' : 'Close',
                style: styles.backBtn,
              },
              icon('leftArrow', 21, p.textPrimary),
            ),
            h(
              Text,
              { style: [styles.headerTitle, { color: p.textPrimary }] },
              headerTitle,
            ),
          ),
          !selectedPlugin && !isImportingPlugin && activeTab === 'plugins'
            ? h(
                View,
                { style: [styles.headerBadge, { backgroundColor: p.surface }] },
                h(
                  Text,
                  { style: [styles.headerBadgeText, { color: p.textSecondary }] },
                  `${activeVisibleCount}/${visiblePlugins.length} active`,
                ),
              )
            : h(
                View,
                { style: [styles.headerBadge, { backgroundColor: p.surface }] },
                h(
                  Text,
                  { style: [styles.headerBadgeText, { color: p.textSecondary }] },
                  `v${version}`,
                ),
              ),
        ),
        !selectedPlugin && !isImportingPlugin && activeTab === 'plugins'
          ? h(PluginsTabView, {
              p,
              plugins: visiblePlugins,
              activeSet,
              favoriteSet,
              pendingRestartNames,
              searchQuery,
              statusFilter,
              categoryFilter,
              onSearchChange: setSearchQuery,
              onStatusFilterChange: setStatusFilter,
              onCategoryFilterChange: setCategoryFilter,
              onSelectPlugin: handleSelectPlugin,
              onTogglePlugin: handleTogglePlugin,
              onRestartNow: handleRestartNow,
              onOpenImportPlugin: handleOpenImportPlugin,
            })
          : h(
              ScrollView,
              {
                keyboardShouldPersistTaps: 'handled',
                contentContainerStyle: styles.scrollContent,
              },
              selectedPlugin
                ? h(PluginDetailTab, {
                    p,
                    plugin: selectedPlugin,
                    enabled: activeSet.has(selectedPlugin.name),
                    favorite: favoriteSet.has(selectedPlugin.name),
                    settingsTick,
                    onTogglePlugin: handleTogglePlugin,
                    onToggleFavorite: handleToggleFavorite,
                    onOpenPluginGithub: handleOpenPluginGithub,
                    onSettingChanged: handleSettingChanged,
                    onResetPluginSettings: handleResetPluginSettings,
                    onClearHistory: handleClearHistory,
                    onUninstallPlugin: handleUninstallPlugin,
                  })
                : isImportingPlugin
                  ? ImportPluginView({
                      p,
                      urlInput: pluginImportUrl,
                      nameInput: pluginImportName,
                      codeInput: pluginImportCode,
                      busy: pluginImportBusy,
                      message: pluginImportMessage,
                      onUrlChange: setPluginImportUrl,
                      onNameChange: setPluginImportName,
                      onCodeChange: setPluginImportCode,
                      onLoadExample: () => setPluginImportCode(EXAMPLE_CUSTOM_PLUGIN_CODE),
                      onImportUrl: handleImportPluginUrl,
                      onImportCode: handleImportPluginCode,
                    })
                  : activeTab === 'themes'
                    ? ThemesTabView({
                        p,
                        subTab: themeSubTab,
                        themes: allThemes,
                        activeThemeId,
                        themeUrlInput,
                        cssNameInput,
                        cssCodeInput,
                        themeBusy,
                        themeMessage,
                        onSubTabChange: setThemeSubTab,
                        onThemeUrlChange: setThemeUrlInput,
                        onCssNameChange: setCssNameInput,
                        onCssCodeChange: setCssCodeInput,
                        onLoadCssTemplate: () => setCssCodeInput(CUSTOM_CSS_TEMPLATE),
                        onInstallCssTheme: handleInstallCssTheme,
                        onInstallTheme: handleInstallTheme,
                        onSelectTheme: handleSelectTheme,
                        onResetTheme: handleResetTheme,
                        onDeleteTheme: handleDeleteTheme,
                      })
                    : activeTab === 'notifications'
                      ? NotificationsTabView({
                          p,
                          entries: notificationEntries,
                          filter: notifFilter,
                          onFilterChange: setNotifFilter,
                          onToggleSetting: handleToggleNotificationSetting,
                          onSendTest: handleSendTestNotification,
                          onDeleteEntry: deleteNotification,
                          onClearAll: clearNotificationLog,
                        })
                      : activeTab === 'updater'
                        ? UpdaterTabView({
                            p,
                            version,
                            updateSourceInput,
                            updateBusy,
                            updateMessage,
                            updateResult,
                            onUpdateSourceChange: handleUpdateSourceChange,
                            onCheckUpdates: handleCheckUpdates,
                            onInstallUpdate: handleInstallUpdate,
                            onOpenRelease: handleOpenRelease,
                            onOpenRepo: handleOpenRepo,
                            onRestartApp: handleRestartNow,
                          })
                        : activeTab === 'backup'
                          ? BackupTabView({
                              p,
                              importInput,
                              exportPreview,
                              backupNotice,
                              onImportInputChange: setImportInput,
                              onExportSettings: handleExportSettings,
                              onImportSettings: handleImportSettings,
                              onRequestReset: () => setConfirmReset(true),
                            })
                          : h(OverviewTab, {
                              p,
                              version,
                              tagline,
                              enabledPlugins: activeVisibleCount,
                              totalPlugins: visiblePlugins.length,
                              activeTheme,
                              activeSet,
                              onOpenTab: handlePushPage,
                              onCheckUpdatesAndOpen: handleCheckUpdatesAndOpen,
                              onReloadApp: handleRestartNow,
                              onOpenRepo: handleOpenRepo,
                              onToggleQuickSwitch: handleToggleQuickSwitch,
                            }),
            ),
        restartPrompt
          ? h(
              View,
              { style: styles.modalBackdrop },
              h(
                View,
                {
                  style: [
                    styles.modalDialog,
                    { backgroundColor: p.surface, borderColor: p.border },
                  ],
                },
                h(
                  View,
                  { style: { flexDirection: 'row', alignItems: 'center' } },
                  icon('restart', 20, p.brand),
                  h(
                    Text,
                    { style: { color: p.textPrimary, fontSize: 18, fontWeight: '800', marginLeft: 8 } },
                    'Restart Required',
                  ),
                ),
                h(
                  Text,
                  {
                    style: {
                      color: p.textSecondary,
                      fontSize: 14,
                      lineHeight: 20,
                      marginTop: 10,
                    },
                  },
                  `${restartPrompt.label} has been ${restartPrompt.nextState}. Nekocord needs to restart Discord so changes apply cleanly.`,
                ),
                restartNotice
                  ? h(
                      Text,
                      {
                        style: {
                          color: p.warning,
                          fontSize: 12,
                          lineHeight: 17,
                          marginTop: 10,
                        },
                      },
                      restartNotice,
                    )
                  : null,
                h(
                  View,
                  {
                    style: {
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      marginTop: 18,
                    },
                  },
                  h(
                    Pressable,
                    {
                      onPress: () => {
                        setRestartPrompt(null);
                        setRestartNotice(null);
                      },
                      style: {
                        backgroundColor: p.surfaceAlt,
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        borderRadius: 8,
                        marginRight: 10,
                      },
                    },
                    h(Text, { style: { color: p.textPrimary, fontSize: 14, fontWeight: '600' } }, 'Later'),
                  ),
                  h(
                    Pressable,
                    {
                      onPress: handleRestartNow,
                      style: {
                        backgroundColor: p.brand,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                      },
                    },
                    h(
                      Text,
                      { style: { color: p.brandOnText, fontSize: 14, fontWeight: '700' } },
                      'Restart Now',
                    ),
                  ),
                ),
              ),
            )
          : null,
        confirmReset
          ? h(
              View,
              { style: styles.modalBackdrop },
              h(
                View,
                {
                  style: [
                    styles.modalDialog,
                    { backgroundColor: p.surface, borderColor: p.border },
                  ],
                },
                h(
                  Text,
                  { style: { color: p.textPrimary, fontSize: 18, fontWeight: '800' } },
                  'Reset Nekocord Settings?',
                ),
                h(
                  Text,
                  {
                    style: {
                      color: p.textSecondary,
                      fontSize: 14,
                      lineHeight: 20,
                      marginTop: 10,
                    },
                  },
                  'This clears all plugin toggles, favorites, custom themes, and your update source override.',
                ),
                h(
                  View,
                  {
                    style: {
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      marginTop: 18,
                    },
                  },
                  h(
                    Pressable,
                    {
                      onPress: () => setConfirmReset(false),
                      style: {
                        backgroundColor: p.surfaceAlt,
                        paddingHorizontal: 15,
                        paddingVertical: 10,
                        borderRadius: 8,
                        marginRight: 10,
                      },
                    },
                    h(Text, { style: { color: p.textPrimary, fontSize: 14, fontWeight: '600' } }, 'Cancel'),
                  ),
                  h(
                    Pressable,
                    {
                      onPress: handleConfirmReset,
                      style: {
                        backgroundColor: p.danger,
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 8,
                      },
                    },
                    h(
                      Text,
                      { style: { color: '#ffffff', fontSize: 14, fontWeight: '700' } },
                      'Reset All',
                    ),
                  ),
                ),
              ),
            )
          : null,
        h(ModalToastHost, null),
      ),
    );
  }

  return NekocordOverlay;
}

/**
 * Creates a floating top toast banner host bound to Nekocord's Notification Log.
 */
export function createNekocordToastHost(
  React: any,
  ReactNative: any,
  options?: { inModal?: boolean },
): any {
  const { Pressable, Text, View } = ReactNative;
  const h = React.createElement;
  const inModal = options?.inModal === true;

  return function NekocordToastHost() {
    const [activeToast, setActiveToast]: [
      NekocordNotificationEntry | null,
      (v: NekocordNotificationEntry | null) => void,
    ] = React.useState(null as NekocordNotificationEntry | null);

    React.useEffect(() => {
      let timerId: any = null;
      const unsubscribe = subscribeToasts((entry) => {
        if (!inModal && modalVisible) {
          return;
        }
        setActiveToast(entry);
        if (timerId !== null) {
          clearTimeout(timerId);
        }
        timerId = setTimeout(() => {
          timerId = null;
          setActiveToast(null);
        }, 4000);
      });
      return () => {
        if (timerId !== null) {
          clearTimeout(timerId);
        }
        unsubscribe();
      };
    }, []);

    if (!activeToast) {
      return null;
    }

    const statusBarHeight = Number(ReactNative.StatusBar?.currentHeight ?? 0) || 0;
    const topOffset = Math.max(52, statusBarHeight + 12);
    const isLight = getStore<{ theme?: string }>('ThemeStore')?.theme === 'light';
    const p = getActivePalette(isLight);
    const accent =
      activeToast.kind === 'success'
        ? p.success
        : activeToast.kind === 'warning'
          ? p.warning
          : activeToast.kind === 'error'
            ? p.danger
            : p.brand;

    return h(
      View,
      {
        pointerEvents: 'box-none',
        style: {
          position: 'absolute',
          top: topOffset,
          left: 14,
          right: 14,
          zIndex: 9999,
          elevation: 24,
        },
      },
      h(
        Pressable,
        {
          onPress: () => {
            setActiveToast(null);
            openNekocordSettings('notifications');
          },
          style: {
            backgroundColor: p.surface,
            borderColor: p.border,
            borderWidth: 1,
            borderLeftWidth: 4,
            borderLeftColor: accent,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 11,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            shadowColor: '#000000',
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 24,
          },
        },
        h(
          View,
          { style: { flex: 1, paddingRight: 10 } },
          h(
            Text,
            { numberOfLines: 1, style: { color: p.textPrimary, fontSize: 13.5, fontWeight: '700' } },
            activeToast.title,
          ),
          h(
            Text,
            { numberOfLines: 2, style: { color: p.textSecondary, fontSize: 12, marginTop: 2 } },
            activeToast.body,
          ),
        ),
        renderVencordIcon(React, ReactNative, 'log', { size: 17, color: accent }),
      ),
    );
  };
}
