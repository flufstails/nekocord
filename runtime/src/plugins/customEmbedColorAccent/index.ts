import { createRowPlugin, ROW_COLOURS } from '../_shared/chatDisplay.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  highlightPinned: {
    type: OptionType.BOOLEAN,
    label: 'Highlight Pinned Messages',
    description: 'Highlight pinned messages right in chat.',
    default: true,
  },
  highlightBots: {
    type: OptionType.BOOLEAN,
    label: 'Highlight Bot / App Messages',
    description: 'Highlight messages sent by bots or apps.',
    default: false,
  },
  accentColor: {
    type: OptionType.SELECT,
    label: 'Accent Color',
    description: 'Choose the side stripe color used for highlighted messages.',
    options: [
      { label: 'Blurple', value: 'blurple' },
      { label: 'Amber', value: 'amber' },
      { label: 'Mint', value: 'mint' },
      { label: 'Cyan', value: 'cyan' },
      { label: 'Purple', value: 'purple' },
    ],
    default: 'purple',
  },
});

const PALETTE_MAP: Record<string, { backgroundColor: number; gutterColor: number }> = {
  blurple: { backgroundColor: ROW_COLOURS.blurpleBg, gutterColor: ROW_COLOURS.blurpleGutter },
  amber: { backgroundColor: ROW_COLOURS.amberBg, gutterColor: ROW_COLOURS.amberGutter },
  mint: { backgroundColor: ROW_COLOURS.mintBg, gutterColor: ROW_COLOURS.mintGutter },
  cyan: { backgroundColor: ROW_COLOURS.cyanBg, gutterColor: ROW_COLOURS.cyanGutter },
  purple: { backgroundColor: ROW_COLOURS.purpleBg, gutterColor: ROW_COLOURS.purpleGutter },
};

const inner = createRowPlugin((row, msg) => {
  if (row.backgroundHighlight) return false;
  const matchPinned = settings.store.highlightPinned && Boolean(msg.pinned);
  const matchBot = settings.store.highlightBots && Boolean(msg.tagText || msg.author?.bot);
  if (!matchPinned && !matchBot) return false;
  row.backgroundHighlight = PALETTE_MAP[settings.store.accentColor] ?? PALETTE_MAP.purple;
  return true;
});

export default definePlugin({
  ...inner,
  settings,
});
