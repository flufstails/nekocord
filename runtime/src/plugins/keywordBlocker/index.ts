import { createRowPlugin, extractMessageText } from '../_shared/chatDisplay.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  blockedWords: {
    type: OptionType.STRING,
    label: 'Filtered Keywords',
    description: 'Comma-separated words or phrases to hide from incoming messages.',
    placeholder: 'spoiler,leak',
    default: 'spoiler',
  },
  caseSensitive: {
    type: OptionType.BOOLEAN,
    label: 'Case Sensitive Match',
    description: 'Only hide words matching exact uppercase or lowercase spelling.',
    default: false,
  },
  replaceWithPlaceholder: {
    type: OptionType.BOOLEAN,
    label: 'Show Hidden Notice',
    description: 'Show "[blocked by KeywordBlocker]" instead of leaving the message blank.',
    default: true,
  },
});

const inner = createRowPlugin((_row, msg) => {
  const raw = String(settings.store.blockedWords || '').trim();
  if (!raw) return false;
  const text = extractMessageText(msg);
  if (!text || text === '[blocked by KeywordBlocker]') return false;

  const sensitive = Boolean(settings.store.caseSensitive);
  const haystack = sensitive ? text : text.toLowerCase();
  const terms = raw.split(',');

  for (let i = 0; i < terms.length; i += 1) {
    const term = terms[i].trim();
    if (!term) continue;
    const needle = sensitive ? term : term.toLowerCase();
    if (haystack.indexOf(needle) !== -1) {
      if (Array.isArray(msg.content)) {
        msg.content = settings.store.replaceWithPlaceholder
          ? [{ type: 'text', content: '[blocked by KeywordBlocker]' }]
          : [];
      } else {
        msg.content = settings.store.replaceWithPlaceholder ? '[blocked by KeywordBlocker]' : '';
      }
      return true;
    }
  }
  return false;
});

export default definePlugin({
  ...inner,
  settings,
});
