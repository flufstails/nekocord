import { createUtilityPlugin } from '../_shared/chatUtility.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  prefix: {
    type: OptionType.STRING,
    label: 'Message Prefix',
    description: 'Text automatically prepended to outgoing messages (for example "> ").',
    placeholder: '> ',
    default: '',
  },
  suffix: {
    type: OptionType.STRING,
    label: 'Message Suffix',
    description: 'Text automatically appended to the end of outgoing messages.',
    placeholder: ' ~',
    default: '',
  },
  skipCommandsAndUrls: {
    type: OptionType.BOOLEAN,
    label: 'Skip Commands & Bare URLs',
    description: 'Leave slash commands and URL-only messages untouched.',
    default: true,
  },
});

const inner = createUtilityPlugin((content) => {
  const trimmed = content.trim();
  if (!trimmed) {
    return content;
  }
  const prefix = String(settings.store.prefix || '');
  const suffix = String(settings.store.suffix || '');
  if (!prefix && !suffix) {
    return content;
  }
  if (settings.store.skipCommandsAndUrls) {
    if (trimmed.indexOf('/') === 0 || /^https?:\/\/\S+$/.test(trimmed)) {
      return content;
    }
  }
  let next = content;
  if (prefix && next.indexOf(prefix) !== 0) {
    next = `${prefix}${next}`;
  }
  if (suffix && next.slice(next.length - suffix.length) !== suffix) {
    next = `${next}${suffix}`;
  }
  return next;
});

export default definePlugin({
  ...inner,
  settings,
});
