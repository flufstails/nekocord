import { patchOutgoingMessageContent, transformOutsideCode } from '../../utils/text.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  enableBuiltinMacros: {
    type: OptionType.BOOLEAN,
    label: 'Built-in Emoticon Macros',
    description: 'Expand :shrug:, :tableflip:, :unflip:, :lenny:, :tm:, :r:, and :c: on send.',
    default: true,
  },
  customFind: {
    type: OptionType.STRING,
    label: 'Custom Find Text',
    description: 'Optional exact phrase to replace in outgoing messages.',
    default: '',
    placeholder: 'e.g. :cat:',
  },
  customReplace: {
    type: OptionType.STRING,
    label: 'Custom Replacement',
    description: 'Text substituted wherever Custom Find Text appears outside code spans.',
    default: '',
    placeholder: 'e.g. (=^.^=)',
  },
});

const REPLACEMENTS: Record<string, string> = {
  ':shrug:': '¯\\_(ツ)_/¯',
  ':tableflip:': '(╯°□°)╯︵ ┻━┻',
  ':unflip:': '┬─┬ノ( º _ ºノ)',
  ':lenny:': '( ͡° ͜ʖ ͡°)',
  ':tm:': '™',
  ':r:': '®',
  ':c:': '©',
};
const TOKEN_RE = /:(shrug|tableflip|unflip|lenny|tm|r|c):/gi;

let unpatch: (() => void) | null = null;

export default definePlugin({
  settings,
  start() {
    unpatch = patchOutgoingMessageContent((content) =>
      transformOutsideCode(content, (seg) => {
        let out = seg;
        if (settings.store.enableBuiltinMacros && out.includes(':')) {
          out = out.replace(TOKEN_RE, (m) => REPLACEMENTS[m.toLowerCase()] ?? m);
        }
        const find = settings.store.customFind;
        if (find) {
          out = out.split(find).join(settings.store.customReplace);
        }
        return out;
      }),
    );
  },
  stop() {
    unpatch?.();
    unpatch = null;
  },
});
