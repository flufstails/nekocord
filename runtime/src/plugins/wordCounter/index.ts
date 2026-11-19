import { patchOutgoingMessageContent } from '../../utils/text.js';
import {
  appendTimestampNote,
  createRowPlugin,
  extractMessageText,
} from '../_shared/chatDisplay.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  mode: {
    type: OptionType.SELECT,
    label: 'Display Mode',
    description: 'Show word counts inline on chat timestamps or append them when sending.',
    options: [
      { label: 'Row Timestamp Badge', value: 'row-badge', default: true },
      { label: 'Append on Send', value: 'outgoing-suffix' },
    ],
    default: 'row-badge',
  },
  minWords: {
    type: OptionType.NUMBER,
    label: 'Minimum Word Threshold',
    description: 'Only show word counts for messages with at least this many words.',
    min: 1,
    max: 500,
    default: 10,
  },
});

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  return trimmed.split(/\s+/).length;
}

const rowInner = createRowPlugin((_row, msg) => {
  if (settings.store.mode !== 'row-badge') {
    return false;
  }
  const count = countWords(extractMessageText(msg));
  const minWords = Number(settings.store.minWords) || 1;
  if (count < minWords) {
    return false;
  }
  return appendTimestampNote(msg, `[${count}w]`);
});

let unpatchSend: (() => void) | null = null;

export default definePlugin({
  settings,
  start() {
    rowInner.start?.();
    unpatchSend = patchOutgoingMessageContent((content) => {
      if (settings.store.mode !== 'outgoing-suffix' || !content) {
        return content;
      }
      const count = countWords(content);
      const minWords = Number(settings.store.minWords) || 1;
      if (count < minWords || /\[\d+\s*words\]$/.test(content.trim())) {
        return content;
      }
      return `${content.trimEnd()} [${count} words]`;
    });
  },
  stop() {
    rowInner.stop?.();
    if (unpatchSend) {
      unpatchSend();
      unpatchSend = null;
    }
  },
});
