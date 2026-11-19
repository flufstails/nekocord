import { getStore, restartDiscordApp } from '../metro/common.js';
import { clearInlineMessageHistory } from '../plugins/messageLogger/index.js';
import type { NekocordPlugin } from '../plugins/types.js';
import {
  DEFAULT_UPDATE_SOURCE,
  getActiveThemeId,
  getUpdateSource,
  setUpdateSource,
  subscribeSettings,
} from '../storage/index.js';
import {
  deleteCustomTheme,
  getActiveTheme,
  getActiveThemeUiPalette,
  getAllThemes,
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

export type NekocordTab = 'overview' | 'plugins' | 'themes';
export type PurrcordTab = NekocordTab;

type PluginFilter =
  | 'all'
  | 'enabled'
  | 'disabled'
  | 'chat'
  | 'ui'
  | 'privacy'
  | 'nitro'
  | 'voice'
  | 'utility'
  | 'developer';

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
}

const DARK_PALETTE: Palette = {
  canvas: '#121316',
  headerBg: '#121316',
  surface: '#1d1e24',
  surfaceAlt: '#262730',
  surfaceHighlight: '#2e303b',
  divider: '#292b33',
  border: '#2c2e38',
  textPrimary: '#f2f3f5',
  textSecondary: '#b5bac1',
  textMuted: '#80848e',
  brand: '#5865f2',
  brandOnText: '#ffffff',
  brandSoft: 'rgba(88, 101, 242, 0.18)',
  success: '#23a55a',
  successSoft: 'rgba(35, 165, 90, 0.18)',
  warning: '#f0b232',
  warningSoft: 'rgba(240, 178, 50, 0.18)',
  danger: '#f23f43',
  dangerSoft: 'rgba(242, 63, 67, 0.18)',
  switchOff: '#4e5058',
};

const LIGHT_PALETTE: Palette = {
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
  brandOnText: '#ffffff',
  brandSoft: 'rgba(88, 101, 242, 0.14)',
  success: '#1a8847',
  successSoft: 'rgba(26, 136, 71, 0.14)',
  warning: '#c88310',
  warningSoft: 'rgba(200, 131, 16, 0.14)',
  danger: '#da373c',
  dangerSoft: 'rgba(218, 55, 60, 0.14)',
  switchOff: '#80848e',
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

/**
 * Creates the root Nekocord modal overlay component mounted above Discord's root view.
 */
export function createNekocordOverlay(React: any, ReactNative: any): any {
  const { FlatList, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } =
    ReactNative;
  const h = React.createElement;

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
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 20,
      marginRight: 6,
    },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    headerBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      marginRight: 6,
    },
    headerBadgeText: { fontSize: 12, fontWeight: '600' },
    tabWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
    tabBar: { flexDirection: 'row', borderRadius: 12, padding: 4 },
    tabBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 9,
      alignItems: 'center',
    },
    tabText: { fontSize: 13 },
    restartBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
    },
    scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 68 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 18,
      marginBottom: 8,
      marginLeft: 4,
    },
    groupedCard: { borderRadius: 16, overflow: 'hidden' },
    divider: { height: 1, marginLeft: 16 },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 52,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 13,
    },
    pluginsFixedHeader: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      height: 42,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      marginLeft: 10,
      paddingVertical: 0,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      marginRight: 7,
    },
    listContent: { paddingHorizontal: 16, paddingBottom: 68 },
    rowInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
      borderRadius: 16,
      borderWidth: 1,
      padding: 20,
    },
  });

  function renderBackArrow(color: string) {
    return h(
      View,
      { style: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' } },
      h(View, {
        style: {
          width: 10,
          height: 10,
          borderLeftWidth: 2.2,
          borderBottomWidth: 2.2,
          borderColor: color,
          transform: [{ rotate: '45deg' }, { translateX: 2 }],
        },
      }),
    );
  }

  function renderChevron(color: string) {
    return h(View, {
      style: {
        width: 8,
        height: 8,
        borderTopWidth: 2,
        borderRightWidth: 2,
        borderColor: color,
        transform: [{ rotate: '45deg' }],
      },
    });
  }

  function renderSearchLoupe(color: string) {
    return h(
      View,
      { style: { width: 16, height: 16, justifyContent: 'center', alignItems: 'center' } },
      h(View, {
        style: {
          width: 11,
          height: 11,
          borderRadius: 6,
          borderWidth: 1.8,
          borderColor: color,
          transform: [{ translateX: -1 }, { translateY: -1 }],
        },
      }),
      h(View, {
        style: {
          position: 'absolute',
          right: 1,
          bottom: 1,
          width: 5,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        },
      }),
    );
  }

  function renderNekoEmblem(brand: string, onBrandText: string) {
    return h(
      View,
      { style: { width: 48, height: 48, marginRight: 14, justifyContent: 'flex-end' } },
      h(
        View,
        {
          style: {
            position: 'absolute',
            top: 0,
            left: 5,
            right: 5,
            flexDirection: 'row',
            justifyContent: 'space-between',
          },
        },
        h(View, {
          style: {
            width: 0,
            height: 0,
            borderLeftWidth: 7,
            borderRightWidth: 7,
            borderBottomWidth: 11,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: brand,
          },
        }),
        h(View, {
          style: {
            width: 0,
            height: 0,
            borderLeftWidth: 7,
            borderRightWidth: 7,
            borderBottomWidth: 11,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: brand,
          },
        }),
      ),
      h(
        View,
        {
          style: {
            width: 48,
            height: 41,
            borderRadius: 14,
            backgroundColor: brand,
            alignItems: 'center',
            justifyContent: 'center',
          },
        },
        h(Text, { style: { color: onBrandText, fontSize: 21, fontWeight: '800' } }, 'N'),
      ),
    );
  }

  function renderSectionHeader(title: string, p: Palette) {
    return h(Text, { style: [styles.sectionTitle, { color: p.textSecondary }] }, title);
  }

  function renderGroupedCard(children: any[], p: Palette) {
    const items = children.filter(Boolean);
    const spaced: any[] = [];
    for (let i = 0; i < items.length; i += 1) {
      if (i > 0) {
        spaced.push(
          h(View, {
            key: `div-${i}`,
            style: [styles.divider, { backgroundColor: p.divider }],
          }),
        );
      }
      spaced.push(items[i]);
    }
    return h(View, { style: [styles.groupedCard, { backgroundColor: p.surface }] }, ...spaced);
  }

  function renderActionRow(
    opts: {
      key: string;
      label: string;
      subtitle?: string;
      value?: string;
      danger?: boolean;
      chevron?: boolean;
      onPress?: () => void;
    },
    p: Palette,
  ) {
    const labelColor = opts.danger ? p.danger : p.textPrimary;
    return h(
      Pressable,
      { key: opts.key, onPress: opts.onPress, style: styles.actionRow },
      h(
        View,
        { style: { flex: 1, paddingRight: 12 } },
        h(Text, { style: { color: labelColor, fontSize: 16, fontWeight: '600' } }, opts.label),
        opts.subtitle
          ? h(
              Text,
              { style: { color: p.textMuted, fontSize: 12, marginTop: 2 } },
              opts.subtitle,
            )
          : null,
      ),
      h(
        View,
        { style: { flexDirection: 'row', alignItems: 'center' } },
        opts.value
          ? h(
              Text,
              {
                style: {
                  color: p.textSecondary,
                  fontSize: 14,
                  fontWeight: '500',
                  marginRight: opts.chevron ? 10 : 0,
                },
              },
              opts.value,
            )
          : null,
        opts.chevron ? renderChevron(p.textMuted) : null,
      ),
    );
  }

  function renderInfoRow(key: string, label: string, val: string, p: Palette, dotColor?: string) {
    return h(
      View,
      { key, style: styles.infoRow },
      h(Text, { style: { color: p.textSecondary, fontSize: 15, fontWeight: '500' } }, label),
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
        h(Text, { style: { color: p.textPrimary, fontSize: 15, fontWeight: '600' } }, val),
      ),
    );
  }

  const PluginRow = React.memo(function PluginRowView(props: {
    plugin: NekocordPlugin;
    enabled: boolean;
    isFirst: boolean;
    isLast: boolean;
    p: Palette;
    onSelect: (plugin: NekocordPlugin) => void;
    onToggle: (plugin: NekocordPlugin) => void;
  }) {
    const { plugin, enabled, isFirst, isLast, p, onSelect, onToggle } = props;
    const catStyle = getCategoryStyle(plugin.category, p);

    return h(
      Pressable,
      {
        onPress: () => onSelect(plugin),
        style: {
          backgroundColor: p.surface,
          paddingHorizontal: 16,
          paddingVertical: 13,
          borderTopLeftRadius: isFirst ? 16 : 0,
          borderTopRightRadius: isFirst ? 16 : 0,
          borderBottomLeftRadius: isLast ? 16 : 0,
          borderBottomRightRadius: isLast ? 16 : 0,
          position: 'relative',
        },
      },
      h(
        View,
        { style: styles.rowInner },
        h(
          View,
          { style: { flex: 1, paddingRight: 12 } },
          h(
            View,
            { style: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' } },
            h(
              Text,
              { style: { color: p.textPrimary, fontSize: 15, fontWeight: '600' } },
              plugin.name,
            ),
            plugin.category
              ? h(
                  View,
                  {
                    style: {
                      marginLeft: 7,
                      backgroundColor: catStyle.bg,
                      borderRadius: 5,
                      paddingHorizontal: 6,
                      paddingVertical: 1.5,
                    },
                  },
                  h(
                    Text,
                    {
                      style: {
                        color: catStyle.fg,
                        fontSize: 9.5,
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
                      marginLeft: 5,
                      backgroundColor: p.warningSoft,
                      borderRadius: 5,
                      paddingHorizontal: 5,
                      paddingVertical: 1.5,
                    },
                  },
                  h(
                    Text,
                    { style: { color: p.warning, fontSize: 9, fontWeight: '700' } },
                    'RESTART',
                  ),
                )
              : null,
          ),
          h(
            Text,
            {
              numberOfLines: 2,
              style: {
                color: p.textMuted,
                fontSize: 12.5,
                lineHeight: 17,
                marginTop: 3,
              },
            },
            plugin.description,
          ),
        ),
        h(Switch, {
          value: enabled,
          trackColor: { false: p.switchOff, true: p.brand },
          thumbColor: '#ffffff',
          onValueChange: () => onToggle(plugin),
        }),
      ),
      !isLast
        ? h(View, {
            style: {
              position: 'absolute',
              left: 16,
              right: 0,
              bottom: 0,
              height: 1,
              backgroundColor: p.divider,
            },
          })
        : null,
    );
  });

  const ThemeRow = React.memo(function ThemeRowView(props: {
    theme: NekocordTheme;
    active: boolean;
    p: Palette;
    onSelect: (theme: NekocordTheme) => void;
    onDelete: (theme: NekocordTheme) => void;
  }) {
    const { theme, active, p, onSelect, onDelete } = props;
    const swatches = theme.preview ?? ['#1e1e2e', '#181825', '#5865f2'];

    return h(
      View,
      {
        style: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 13,
        },
      },
      h(
        View,
        { style: { flex: 1, paddingRight: 12 } },
        h(
          View,
          { style: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' } },
          h(
            View,
            {
              style: {
                flexDirection: 'row',
                borderRadius: 6,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: p.border,
                marginRight: 9,
              },
            },
            ...swatches.slice(0, 3).map((hex, sIdx) =>
              h(View, {
                key: `sw-${sIdx}`,
                style: {
                  width: 9,
                  height: 16,
                  backgroundColor: hex,
                },
              }),
            ),
          ),
          h(
            Text,
            { style: { color: p.textPrimary, fontSize: 15, fontWeight: '600' } },
            theme.name,
          ),
          h(
            View,
            {
              style: {
                marginLeft: 7,
                backgroundColor: theme.builtin ? p.brandSoft : p.surfaceAlt,
                borderRadius: 5,
                paddingHorizontal: 6,
                paddingVertical: 1.5,
              },
            },
            h(
              Text,
              {
                style: {
                  color: theme.builtin ? '#8ea1ff' : p.textSecondary,
                  fontSize: 9.5,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                },
              },
              theme.builtin ? 'Built-in' : 'Custom',
            ),
          ),
          theme.baseMode
            ? h(
                View,
                {
                  style: {
                    marginLeft: 5,
                    backgroundColor: p.surfaceAlt,
                    borderRadius: 5,
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
        theme.description
          ? h(
              Text,
              {
                numberOfLines: 2,
                style: {
                  color: p.textMuted,
                  fontSize: 12.5,
                  lineHeight: 17,
                  marginTop: 4,
                },
              },
              theme.description,
            )
          : null,
        !theme.builtin
          ? h(
              Pressable,
              {
                onPress: () => onDelete(theme),
                style: { alignSelf: 'flex-start', marginTop: 6 },
              },
              h(Text, { style: { color: p.danger, fontSize: 12, fontWeight: '600' } }, 'Remove'),
            )
          : null,
      ),
      h(Switch, {
        value: active,
        trackColor: { false: p.switchOff, true: p.brand },
        thumbColor: '#ffffff',
        onValueChange: () => onSelect(theme),
      }),
    );
  });

  const OverviewTab = React.memo(function OverviewTabView(ctx: {
    p: Palette;
    version: string;
    tagline: string;
    enabledPlugins: number;
    totalPlugins: number;
    activeTheme: NekocordTheme | null;
    updateSourceInput: string;
    updateBusy: boolean;
    updateMessage: string | null;
    updateResult: UpdateCheckResult | null;
    onUpdateSourceChange: (value: string) => void;
    onCheckUpdates: () => void;
    onInstallUpdate: () => void;
    onOpenRelease: () => void;
    onOpenTab: (tab: NekocordTab) => void;
    onReloadApp: () => void;
  }) {
    const { p } = ctx;
    const statusColor =
      ctx.updateResult?.status === 'update-available'
        ? p.success
        : ctx.updateResult?.status === 'error'
          ? p.warning
          : p.textSecondary;

    return h(
      React.Fragment,
      null,
      h(
        View,
        {
          style: {
            backgroundColor: p.surface,
            borderRadius: 16,
            overflow: 'hidden',
            marginTop: 4,
          },
        },
        h(View, { style: { height: 3, backgroundColor: p.brand } }),
        h(
          View,
          { style: { padding: 16 } },
          h(
            View,
            { style: { flexDirection: 'row', alignItems: 'center' } },
            renderNekoEmblem(p.brand, p.brandOnText),
            h(
              View,
              { style: { flex: 1 } },
              h(
                View,
                { style: { flexDirection: 'row', alignItems: 'center' } },
                h(
                  Text,
                  { style: { color: p.textPrimary, fontSize: 20, fontWeight: '800' } },
                  'Nekocord',
                ),
                h(
                  View,
                  {
                    style: {
                      marginLeft: 8,
                      backgroundColor: p.brandSoft,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                    },
                  },
                  h(
                    Text,
                    { style: { color: '#8ea1ff', fontSize: 11, fontWeight: '700' } },
                    `v${ctx.version}`,
                  ),
                ),
              ),
              h(
                Text,
                {
                  style: {
                    color: p.textSecondary,
                    fontSize: 13,
                    fontWeight: '500',
                    marginTop: 3,
                  },
                },
                ctx.tagline,
              ),
            ),
          ),
          h(
            View,
            {
              style: {
                flexDirection: 'row',
                marginTop: 14,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: p.divider,
              },
            },
            h(
              View,
              { style: { flex: 0.9, paddingRight: 10 } },
              h(Text, { style: { color: p.textMuted, fontSize: 11, fontWeight: '600' } }, 'PLUGINS'),
              h(
                Text,
                { style: { color: p.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 2 } },
                `${ctx.enabledPlugins} / ${ctx.totalPlugins}`,
              ),
            ),
            h(
              View,
              { style: { flex: 1.45, paddingRight: 12 } },
              h(Text, { style: { color: p.textMuted, fontSize: 11, fontWeight: '600' } }, 'THEME'),
              h(
                Text,
                {
                  numberOfLines: 1,
                  style: { color: p.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 2 },
                },
                ctx.activeTheme ? ctx.activeTheme.name : 'Default',
              ),
            ),
            h(
              View,
              { style: { flex: 0.75 } },
              h(Text, { style: { color: p.textMuted, fontSize: 11, fontWeight: '600' } }, 'DISCORD'),
              h(
                Text,
                { style: { color: p.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 2 } },
                '353.11',
              ),
            ),
          ),
        ),
      ),
      renderSectionHeader('About', p),
      renderGroupedCard(
        [
          renderInfoRow('ab-version', 'Version', ctx.version, p),
          renderInfoRow('ab-author', 'Author', 'flufstails', p),
          renderInfoRow('ab-repo', 'Repository', DEFAULT_UPDATE_SOURCE, p),
        ],
        p,
      ),
      renderSectionHeader('Updates', p),
      h(
        View,
        { style: { backgroundColor: p.surface, borderRadius: 16, padding: 16 } },
        h(
          Text,
          { style: { color: p.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 } },
          'Update Source (GitHub owner/repo or manifest/bundle URL)',
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
                borderRadius: 10,
                paddingHorizontal: 12,
                height: 40,
                color: p.textPrimary,
                fontSize: 13,
              },
            })
          : null,
        h(
          View,
          { style: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 } },
          h(
            Pressable,
            {
              onPress: ctx.updateBusy ? undefined : ctx.onCheckUpdates,
              style: {
                backgroundColor: p.brand,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 10,
                marginRight: 8,
                marginBottom: 4,
              },
            },
            h(
              Text,
              { style: { color: p.brandOnText, fontSize: 13, fontWeight: '700' } },
              ctx.updateBusy ? 'Checking...' : 'Check for Updates',
            ),
          ),
          ctx.updateResult?.bundleUrl
            ? h(
                Pressable,
                {
                  onPress: ctx.updateBusy ? undefined : ctx.onInstallUpdate,
                  style: {
                    backgroundColor: p.success,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 10,
                    marginRight: 8,
                    marginBottom: 4,
                  },
                },
                h(
                  Text,
                  { style: { color: '#ffffff', fontSize: 13, fontWeight: '700' } },
                  'Install Update & Restart',
                ),
              )
            : null,
          ctx.updateResult?.releaseUrl
            ? h(
                Pressable,
                {
                  onPress: ctx.onOpenRelease,
                  style: {
                    backgroundColor: p.surfaceAlt,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 10,
                    marginBottom: 4,
                  },
                },
                h(
                  Text,
                  { style: { color: p.textPrimary, fontSize: 13, fontWeight: '600' } },
                  'Open Release',
                ),
              )
            : null,
        ),
        ctx.updateMessage
          ? h(
              Text,
              {
                style: {
                  color: statusColor,
                  fontSize: 12,
                  lineHeight: 17,
                  marginTop: 8,
                },
              },
              ctx.updateMessage,
            )
          : null,
      ),
      renderSectionHeader('Quick Actions', p),
      renderGroupedCard(
        [
          renderActionRow(
            {
              key: 'qa-plugins',
              label: 'Plugins',
              value: `${ctx.enabledPlugins}/${ctx.totalPlugins}`,
              chevron: true,
              onPress: () => ctx.onOpenTab('plugins'),
            },
            p,
          ),
          renderActionRow(
            {
              key: 'qa-themes',
              label: 'Themes',
              value: ctx.activeTheme ? ctx.activeTheme.name : 'Default',
              chevron: true,
              onPress: () => ctx.onOpenTab('themes'),
            },
            p,
          ),
          renderActionRow(
            {
              key: 'qa-reload',
              label: 'Reload Discord',
              subtitle: 'Restart the client to apply pending plugin or theme changes',
              chevron: true,
              onPress: ctx.onReloadApp,
            },
            p,
          ),
        ],
        p,
      ),
    );
  });

  const PluginDetailTab = React.memo(function PluginDetailView(ctx: {
    p: Palette;
    plugin: NekocordPlugin;
    enabled: boolean;
    onTogglePlugin: (plugin: NekocordPlugin) => void;
    onClearHistory: () => void;
  }) {
    const { p, plugin } = ctx;
    const catStyle = getCategoryStyle(plugin.category, p);
    const readmeBlocks = React.useMemo(() => parseReadmeBlocks(plugin), [plugin]);
    const tags = plugin.tags?.filter((t) => t !== plugin.category).slice(0, 4) ?? [];

    const infoRows: any[] = [
      renderInfoRow(
        'pd-status',
        'Status',
        ctx.enabled ? 'Enabled' : 'Disabled',
        p,
        ctx.enabled ? p.success : p.textMuted,
      ),
      renderInfoRow('pd-authors', 'Author', plugin.authors.join(', '), p),
      renderInfoRow('pd-cat', 'Category', plugin.category.toUpperCase(), p),
      renderInfoRow('pd-dir', 'Directory', `plugins/${plugin.slug}`, p),
    ];
    if (plugin.requiresRestart) {
      infoRows.push(renderInfoRow('pd-restart', 'Requires Restart', 'Yes', p, p.warning));
    }

    return h(
      React.Fragment,
      null,
      h(
        View,
        { style: { backgroundColor: p.surface, borderRadius: 16, padding: 16, marginTop: 4 } },
        h(
          View,
          { style: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' } },
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
                    marginLeft: 10,
                    backgroundColor: catStyle.bg,
                    borderRadius: 6,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  },
                },
                h(
                  Text,
                  {
                    style: {
                      color: catStyle.fg,
                      fontSize: 11,
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
                    borderRadius: 6,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                  },
                },
                h(Text, { style: { color: p.warning, fontSize: 10.5, fontWeight: '700' } }, 'RESTART'),
              )
            : null,
        ),
        h(
          Text,
          { style: { color: p.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 10 } },
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
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      marginRight: 6,
                      marginTop: 4,
                    },
                  },
                  h(Text, { style: { color: p.textMuted, fontSize: 11, fontWeight: '600' } }, `#${tag}`),
                ),
              ),
            )
          : null,
      ),
      renderSectionHeader('Settings', p),
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
                paddingHorizontal: 16,
                paddingVertical: 14,
              },
            },
            h(
              Text,
              { style: { color: p.textPrimary, fontSize: 16, fontWeight: '600', flex: 1 } },
              `Enable ${plugin.name}`,
            ),
            h(Switch, {
              value: ctx.enabled,
              trackColor: { false: p.switchOff, true: p.brand },
              thumbColor: '#ffffff',
              onValueChange: () => ctx.onTogglePlugin(plugin),
            }),
          ),
        ],
        p,
      ),
      renderSectionHeader('Documentation (README.md)', p),
      h(
        View,
        { style: { backgroundColor: p.surface, borderRadius: 16, padding: 16 } },
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
      renderSectionHeader('Details', p),
      renderGroupedCard(infoRows, p),
      plugin.name === 'MessageLogger'
        ? h(
            React.Fragment,
            null,
            renderSectionHeader('Actions', p),
            renderGroupedCard(
              [
                renderActionRow(
                  {
                    key: 'ml-clear',
                    label: 'Clear Inline History',
                    danger: true,
                    onPress: ctx.onClearHistory,
                  },
                  p,
                ),
              ],
              p,
            ),
          )
        : null,
    );
  });

  function PluginsTabView(ctx: {
    p: Palette;
    plugins: NekocordPlugin[];
    activeSet: ReadonlySet<string>;
    searchQuery: string;
    filter: PluginFilter;
    onSearchChange: (q: string) => void;
    onFilterChange: (f: PluginFilter) => void;
    onSelectPlugin: (plugin: NekocordPlugin) => void;
    onTogglePlugin: (plugin: NekocordPlugin) => void;
  }) {
    const { p, plugins, activeSet, searchQuery, filter } = ctx;

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

    const filtered = React.useMemo(() => {
      const normalized = searchQuery.trim().toLowerCase();
      return plugins.filter((plugin) => {
        const enabled = activeSet.has(plugin.name);
        if (filter === 'enabled' && !enabled) return false;
        if (filter === 'disabled' && enabled) return false;
        if (filter !== 'all' && filter !== 'enabled' && filter !== 'disabled' && plugin.category !== filter) {
          return false;
        }
        if (!normalized) return true;
        if (
          plugin.name.toLowerCase().includes(normalized) ||
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
    }, [plugins, activeSet, searchQuery, filter]);

    const filters: Array<{ id: PluginFilter; label: string }> = [
      { id: 'all', label: `All (${plugins.length})` },
      { id: 'enabled', label: `Enabled (${visibleEnabledCount})` },
      { id: 'disabled', label: `Disabled (${Math.max(0, plugins.length - visibleEnabledCount)})` },
      { id: 'chat', label: `Chat (${categoryCounts.chat ?? 0})` },
      { id: 'ui', label: `UI (${categoryCounts.ui ?? 0})` },
      { id: 'privacy', label: `Privacy (${categoryCounts.privacy ?? 0})` },
      { id: 'nitro', label: `Nitro (${categoryCounts.nitro ?? 0})` },
      { id: 'voice', label: `Voice (${categoryCounts.voice ?? 0})` },
      { id: 'utility', label: `Utility (${categoryCounts.utility ?? 0})` },
      { id: 'developer', label: `Dev (${categoryCounts.developer ?? 0})` },
    ];

    const keyExtractor = React.useCallback((item: NekocordPlugin) => item.name, []);
    const renderItem = React.useCallback(
      ({ item, index }: { item: NekocordPlugin; index: number }) =>
        h(PluginRow, {
          plugin: item,
          enabled: activeSet.has(item.name),
          isFirst: index === 0,
          isLast: index === filtered.length - 1,
          p,
          onSelect: ctx.onSelectPlugin,
          onToggle: ctx.onTogglePlugin,
        }),
      [activeSet, filtered.length, p, ctx.onSelectPlugin, ctx.onTogglePlugin],
    );

    const fixedControls = h(
      View,
      { style: styles.pluginsFixedHeader },
      h(
        View,
        {
          style: [
            styles.searchBox,
            { backgroundColor: p.surface, borderColor: p.border },
          ],
        },
        renderSearchLoupe(p.textMuted),
        TextInput
          ? h(TextInput, {
              value: searchQuery,
              onChangeText: ctx.onSearchChange,
              placeholder: `Search ${plugins.length} plugins, categories, or tags`,
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
        ScrollView,
        {
          horizontal: true,
          showsHorizontalScrollIndicator: false,
          keyboardShouldPersistTaps: 'handled',
          style: { marginTop: 10 },
          contentContainerStyle: { paddingRight: 8 },
        },
        ...filters.map((item) => {
          const active = filter === item.id;
          return h(
            Pressable,
            {
              key: item.id,
              onPress: () => ctx.onFilterChange(item.id),
              style: [
                styles.filterChip,
                { backgroundColor: active ? p.brand : p.surface },
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
      ),
    );

    const emptyView = h(
      View,
      {
        style: {
          backgroundColor: p.surface,
          borderRadius: 16,
          padding: 24,
          alignItems: 'center',
          marginTop: 4,
        },
      },
      h(
        Text,
        { style: { color: p.textPrimary, fontSize: 15, fontWeight: '700' } },
        'No plugins match that filter',
      ),
      h(
        Text,
        { style: { color: p.textMuted, fontSize: 13, marginTop: 4 } },
        'Try clearing the search query or switching filter pills.',
      ),
    );

    return h(
      View,
      { style: { flex: 1 } },
      fixedControls,
      FlatList
        ? h(FlatList, {
            style: { flex: 1 },
            data: filtered,
            extraData: activeSet,
            keyExtractor,
            renderItem,
            ListEmptyComponent: emptyView,
            keyboardShouldPersistTaps: 'handled',
            initialNumToRender: 14,
            maxToRenderPerBatch: 12,
            updateCellsBatchingPeriod: 30,
            windowSize: 9,
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
            filtered.length === 0
              ? emptyView
              : h(
                  React.Fragment,
                  null,
                  ...filtered.map((item: NekocordPlugin, index: number) =>
                    h(PluginRow, {
                      key: item.name,
                      plugin: item,
                      enabled: activeSet.has(item.name),
                      isFirst: index === 0,
                      isLast: index === filtered.length - 1,
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
    themes: NekocordTheme[];
    activeThemeId: string | null;
    themeUrlInput: string;
    themeBusy: boolean;
    themeMessage: { text: string; tone: 'success' | 'error' } | null;
    onThemeUrlChange: (url: string) => void;
    onInstallTheme: () => void;
    onSelectTheme: (theme: NekocordTheme) => void;
    onDeleteTheme: (theme: NekocordTheme) => void;
  }) {
    const { p } = ctx;
    return h(
      React.Fragment,
      null,
      renderSectionHeader('Install Theme', p),
      h(
        View,
        { style: { backgroundColor: p.surface, borderRadius: 16, padding: 16 } },
        h(
          Text,
          { style: { color: p.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 } },
          'Theme JSON URL (Vendetta / Bunny format)',
        ),
        h(
          View,
          { style: { flexDirection: 'row', alignItems: 'center' } },
          TextInput
            ? h(TextInput, {
                value: ctx.themeUrlInput,
                onChangeText: ctx.onThemeUrlChange,
                placeholder: 'https://.../theme.json',
                placeholderTextColor: p.textMuted,
                autoCapitalize: 'none',
                autoCorrect: false,
                style: {
                  flex: 1,
                  backgroundColor: p.surfaceAlt,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  height: 40,
                  color: p.textPrimary,
                  fontSize: 13,
                  marginRight: 8,
                },
              })
            : null,
          h(
            Pressable,
            {
              onPress: ctx.themeBusy ? undefined : ctx.onInstallTheme,
              style: {
                backgroundColor: p.brand,
                paddingHorizontal: 16,
                height: 40,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              },
            },
            h(
              Text,
              { style: { color: p.brandOnText, fontSize: 13, fontWeight: '700' } },
              ctx.themeBusy ? '...' : 'Install',
            ),
          ),
        ),
        ctx.themeMessage
          ? h(
              Text,
              {
                style: {
                  color: ctx.themeMessage.tone === 'success' ? p.success : p.warning,
                  fontSize: 12,
                  marginTop: 8,
                },
              },
              ctx.themeMessage.text,
            )
          : null,
      ),
      renderSectionHeader(`Themes (${ctx.themes.length})`, p),
      renderGroupedCard(
        ctx.themes.map((theme) =>
          h(ThemeRow, {
            key: theme.id,
            theme,
            active: ctx.activeThemeId === theme.id,
            p,
            onSelect: ctx.onSelectTheme,
            onDelete: ctx.onDeleteTheme,
          }),
        ),
        p,
      ),
    );
  }

  function NekocordOverlay() {
    const [isOpen, setIsOpen] = React.useState(modalVisible);
    const [activeTab, setActiveTab] = React.useState(requestedTab);
    const [selectedPluginName, setSelectedPluginName] = React.useState(null as string | null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [pluginFilter, setPluginFilter] = React.useState('all' as PluginFilter);
    const [pendingRestartNames, setPendingRestartNames] = React.useState([] as string[]);
    const [restartPrompt, setRestartPrompt] = React.useState(
      null as { label: string; nextState: string } | null,
    );
    const [restartNotice, setRestartNotice] = React.useState(null as string | null);
    const [themeUrlInput, setThemeUrlInput] = React.useState('');
    const [themeBusy, setThemeBusy] = React.useState(false);
    const [themeMessage, setThemeMessage] = React.useState(
      null as { text: string; tone: 'success' | 'error' } | null,
    );
    const [updateSourceInput, setUpdateSourceInput] = React.useState(() => getUpdateSource());
    const [updateBusy, setUpdateBusy] = React.useState(false);
    const [updateMessage, setUpdateMessage] = React.useState(null as string | null);
    const [updateResult, setUpdateResult] = React.useState(null as UpdateCheckResult | null);
    const [settingsTick, setSettingsTick] = React.useState(0);

    React.useEffect(() => {
      const onModalToggle = (nextOpen: boolean, nextTab: NekocordTab) => {
        setIsOpen(nextOpen);
        if (nextOpen) {
          setActiveTab(nextTab);
          setSelectedPluginName(null);
          setUpdateSourceInput(getUpdateSource());
        }
      };
      modalListeners.add(onModalToggle);
      const unsubscribe = subscribeSettings(() => {
        setSettingsTick((n: number) => n + 1);
      });
      return () => {
        modalListeners.delete(onModalToggle);
        unsubscribe();
      };
    }, []);

    const nekocord = globalThis.Nekocord;
    const isLight = getStore<{ theme?: string }>('ThemeStore')?.theme === 'light';
    const activeTheme = getActiveTheme();
    const p = React.useMemo(() => getActivePalette(isLight), [isLight, activeTheme]);

    const visiblePlugins = React.useMemo(
      () => Array.from(nekocord?.plugins.values() ?? []).filter((pl) => !pl.core),
      [nekocord],
    );

    const activeSet: ReadonlySet<string> = React.useMemo(
      () => nekocord?.getActivePlugins() ?? new Set<string>(),
      [nekocord, settingsTick],
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
      if (selectedPluginName) {
        setSelectedPluginName(null);
        return;
      }
      closeNekocordSettings();
    }, [selectedPluginName]);

    const queueRestartPrompt = React.useCallback((label: string, nextState: string) => {
      setPendingRestartNames((prev: string[]) => (prev.includes(label) ? prev : [...prev, label]));
      setRestartNotice(null);
      setRestartPrompt({ label, nextState });
    }, []);

    const handleTogglePlugin = React.useCallback(
      (plugin: NekocordPlugin) => {
        if (plugin.core) {
          return;
        }
        const wasEnabled = nekocord?.getActivePlugins().has(plugin.name) ?? false;
        nekocord?.togglePlugin(plugin.name);
        if (plugin.requiresRestart) {
          queueRestartPrompt(plugin.name, wasEnabled ? 'disabled' : 'enabled');
        }
      },
      [nekocord, queueRestartPrompt],
    );

    const handleSelectPlugin = React.useCallback((plugin: NekocordPlugin) => {
      setSelectedPluginName(plugin.name);
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

    const handleInstallUpdate = React.useCallback(async () => {
      if (!updateResult) return;
      setUpdateBusy(true);
      setUpdateMessage('Downloading update bundle...');
      const res = await applyRuntimeUpdate(updateResult);
      setUpdateBusy(false);
      setUpdateMessage(res.message);
      if (res.ok) {
        queueRestartPrompt(`Nekocord v${updateResult.latestVersion ?? '1.0.0'}`, 'downloaded');
      }
    }, [updateResult, queueRestartPrompt]);

    const handleOpenRelease = React.useCallback(() => {
      if (updateResult?.releaseUrl) {
        openReleasePage(updateResult.releaseUrl);
      }
    }, [updateResult]);

    if (!isOpen) {
      return null;
    }

    const version = nekocord?.version ?? '1.0.0';
    const tagline = nekocord?.tagline ?? 'Your cutest Discord client on mobile';
    const selectedPlugin =
      selectedPluginName && !nekocord?.plugins.get(selectedPluginName)?.core
        ? nekocord?.plugins.get(selectedPluginName) ?? null
        : null;
    const allThemes = getAllThemes();
    const activeThemeId = getActiveThemeId();

    const headerTitle = selectedPlugin
      ? selectedPlugin.name
      : activeTab === 'plugins'
        ? 'Plugins'
        : activeTab === 'themes'
          ? 'Themes'
          : 'Nekocord';

    const tabs: Array<{ id: NekocordTab; label: string }> = [
      { id: 'overview', label: 'Nekocord' },
      { id: 'plugins', label: `Plugins (${visiblePlugins.length})` },
      { id: 'themes', label: 'Themes' },
    ];

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
                accessibilityLabel: selectedPlugin ? 'Back' : 'Close',
                style: styles.backBtn,
              },
              renderBackArrow(p.textPrimary),
            ),
            h(
              Text,
              { style: [styles.headerTitle, { color: p.textPrimary }] },
              headerTitle,
            ),
          ),
          !selectedPlugin && activeTab === 'plugins'
            ? h(
                View,
                { style: [styles.headerBadge, { backgroundColor: p.surface }] },
                h(
                  Text,
                  { style: [styles.headerBadgeText, { color: p.textSecondary }] },
                  `${activeVisibleCount}/${visiblePlugins.length} active`,
                ),
              )
            : null,
        ),
        !selectedPlugin
          ? h(
              View,
              { style: [styles.tabWrap, { backgroundColor: p.canvas }] },
              h(
                View,
                { style: [styles.tabBar, { backgroundColor: p.surface }] },
                ...tabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return h(
                    Pressable,
                    {
                      key: tab.id,
                      onPress: () => {
                        setActiveTab(tab.id);
                        setSelectedPluginName(null);
                      },
                      style: [
                        styles.tabBtn,
                        { backgroundColor: active ? p.surfaceHighlight : 'transparent' },
                      ],
                    },
                    h(
                      Text,
                      {
                        style: [
                          styles.tabText,
                          {
                            color: active ? p.textPrimary : p.textMuted,
                            fontWeight: active ? '700' : '600',
                          },
                        ],
                      },
                      tab.label,
                    ),
                  );
                }),
              ),
            )
          : null,
        pendingRestartNames.length > 0
          ? h(
              View,
              {
                style: [
                  styles.restartBanner,
                  { backgroundColor: p.warningSoft, borderColor: p.warning },
                ],
              },
              h(
                View,
                { style: { flex: 1, paddingRight: 10 } },
                h(
                  Text,
                  { style: { color: p.warning, fontSize: 12, fontWeight: '800' } },
                  'RESTART REQUIRED',
                ),
                h(
                  Text,
                  {
                    numberOfLines: 2,
                    style: { color: p.textPrimary, fontSize: 12, marginTop: 2 },
                  },
                  `${pendingRestartNames.length} change${pendingRestartNames.length === 1 ? '' : 's'} queued (${pendingRestartNames.slice(0, 3).join(', ')}${pendingRestartNames.length > 3 ? '...' : ''})`,
                ),
              ),
              h(
                Pressable,
                {
                  onPress: handleRestartNow,
                  style: {
                    backgroundColor: p.brand,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  },
                },
                h(Text, { style: { color: p.brandOnText, fontSize: 12, fontWeight: '700' } }, 'Restart'),
              ),
            )
          : null,
        !selectedPlugin && activeTab === 'plugins'
          ? h(PluginsTabView, {
              p,
              plugins: visiblePlugins,
              activeSet,
              searchQuery,
              filter: pluginFilter,
              onSearchChange: setSearchQuery,
              onFilterChange: setPluginFilter,
              onSelectPlugin: handleSelectPlugin,
              onTogglePlugin: handleTogglePlugin,
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
                    onTogglePlugin: handleTogglePlugin,
                    onClearHistory: handleClearHistory,
                  })
                : activeTab === 'themes'
                  ? ThemesTabView({
                      p,
                      themes: allThemes,
                      activeThemeId,
                      themeUrlInput,
                      themeBusy,
                      themeMessage,
                      onThemeUrlChange: setThemeUrlInput,
                      onInstallTheme: handleInstallTheme,
                      onSelectTheme: handleSelectTheme,
                      onDeleteTheme: handleDeleteTheme,
                    })
                  : h(OverviewTab, {
                      p,
                      version,
                      tagline,
                      enabledPlugins: activeVisibleCount,
                      totalPlugins: visiblePlugins.length,
                      activeTheme,
                      updateSourceInput,
                      updateBusy,
                      updateMessage,
                      updateResult,
                      onUpdateSourceChange: handleUpdateSourceChange,
                      onCheckUpdates: handleCheckUpdates,
                      onInstallUpdate: handleInstallUpdate,
                      onOpenRelease: handleOpenRelease,
                      onOpenTab: setActiveTab,
                      onReloadApp: handleRestartNow,
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
                  Text,
                  { style: { color: p.textPrimary, fontSize: 18, fontWeight: '800' } },
                  'Restart Required',
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
                      marginTop: 20,
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
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 10,
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
                        paddingHorizontal: 18,
                        paddingVertical: 10,
                        borderRadius: 10,
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
      ),
    );
  }

  return NekocordOverlay;
}
