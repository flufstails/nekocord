import { createUtilityPlugin } from '../_shared/chatUtility.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  maxBlankLines: {
    type: OptionType.NUMBER,
    label: 'Max Consecutive Blank Lines',
    description: 'Collapse runs of extra newlines down to this maximum.',
    min: 1,
    max: 5,
    default: 2,
  },
  trimLineEnds: {
    type: OptionType.BOOLEAN,
    label: 'Trim Line Trailing Spaces',
    description: 'Strip invisible spaces at the end of every line before sending.',
    default: true,
  },
});

const inner = createUtilityPlugin((content) => {
  let out = content.replace(/\r\n/g, '\n');
  if (settings.store.trimLineEnds) {
    out = out
      .split('\n')
      .map((line) => line.replace(/[ \t]+$/, ''))
      .join('\n');
  }
  const maxNl = Math.max(1, Number(settings.store.maxBlankLines) || 2);
  const re = new RegExp(`\\n{${maxNl + 1},}`, 'g');
  return out.replace(re, '\n'.repeat(maxNl));
});

export default definePlugin({
  ...inner,
  settings,
});
