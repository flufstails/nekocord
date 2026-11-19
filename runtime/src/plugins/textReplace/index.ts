import { patchOutgoingMessageContent, transformOutsideCode } from '../../utils/text.js';
import { definePlugin } from '../types.js';

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
  start() {
    unpatch = patchOutgoingMessageContent((content) => {
      if (!content.includes(':')) return content;
      return transformOutsideCode(content, (seg) =>
        seg.replace(TOKEN_RE, (m) => REPLACEMENTS[m.toLowerCase()] ?? m),
      );
    });
  },
  stop() {
    unpatch?.();
    unpatch = null;
  },
});
