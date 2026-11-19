import { createRowPlugin, extractMessageText, ROW_COLOURS } from '../_shared/chatDisplay.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  keywords: {
    type: OptionType.STRING,
    label: 'Alert Keywords',
    description: 'Comma-separated keywords that trigger a colored highlight on matching chat messages.',
    placeholder: 'nekocord,urgent,deploy',
    default: 'nekocord,urgent',
  },
  caseSensitive: {
    type: OptionType.BOOLEAN,
    label: 'Case Sensitive Matching',
    description: 'Match keyword capitalization strictly instead of case-insensitive comparison.',
    default: false,
  },
  highlightColor: {
    type: OptionType.SELECT,
    label: 'Highlight Color',
    description: 'Gutter and subtle row background tint applied when a keyword matches.',
    options: [
      { label: 'Amber', value: 'amber', default: true },
      { label: 'Blurple', value: 'blurple' },
      { label: 'Mint Green', value: 'mint' },
      { label: 'Cyan', value: 'cyan' },
      { label: 'Purple', value: 'purple' },
    ],
    default: 'amber',
  },
});

const COLOR_PRESETS: Record<string, { backgroundColor: number; gutterColor: number }> = {
  amber: { backgroundColor: ROW_COLOURS.amberBg, gutterColor: ROW_COLOURS.amberGutter },
  blurple: { backgroundColor: ROW_COLOURS.blurpleBg, gutterColor: ROW_COLOURS.blurpleGutter },
  mint: { backgroundColor: ROW_COLOURS.mintBg, gutterColor: ROW_COLOURS.mintGutter },
  cyan: { backgroundColor: ROW_COLOURS.cyanBg, gutterColor: ROW_COLOURS.cyanGutter },
  purple: { backgroundColor: ROW_COLOURS.purpleBg, gutterColor: ROW_COLOURS.purpleGutter },
};

const inner = createRowPlugin((row, msg) => {
  if (row.backgroundHighlight) {
    return false;
  }
  const rawKeywords = String(settings.store.keywords || '').trim();
  if (!rawKeywords) {
    return false;
  }
  const text = extractMessageText(msg);
  if (!text) {
    return false;
  }
  const sensitive = Boolean(settings.store.caseSensitive);
  const haystack = sensitive ? text : text.toLowerCase();
  const terms = rawKeywords.split(',');

  for (let i = 0; i < terms.length; i += 1) {
    const term = terms[i].trim();
    if (!term) continue;
    const needle = sensitive ? term : term.toLowerCase();
    if (haystack.indexOf(needle) !== -1) {
      row.backgroundHighlight = COLOR_PRESETS[settings.store.highlightColor] ?? COLOR_PRESETS.amber;
      return true;
    }
  }
  return false;
});

export default definePlugin({
  ...inner,
  settings,
});
