import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  snippet1: {
    type: OptionType.STRING,
    label: 'Snippet 1 (\\s1)',
    description: 'Saved message replaced automatically whenever you type \\s1.',
    placeholder: 'Thank you!',
    default: 'On my way!',
  },
  snippet2: {
    type: OptionType.STRING,
    label: 'Snippet 2 (\\s2)',
    description: 'Saved message replaced automatically whenever you type \\s2.',
    placeholder: 'Check this out!',
    default: 'Checking this now.',
  },
});

const inner = createUtilityPlugin((content) =>
  transformOutsideCode(content, (seg) =>
    seg
      .replace(/\\s1\b/g, () => String(settings.store.snippet1 || ''))
      .replace(/\\s2\b/g, () => String(settings.store.snippet2 || '')),
  ),
);

export default definePlugin({
  ...inner,
  settings,
});
