import { patchOutgoingMessageContent, transformOutsideCode } from '../../utils/text.js';
import { definePlugin } from '../types.js';

const KAOMOJI_MAP: Record<string, string> = {
  ':shrug:': '¯\\_(ツ)_/¯',
  ':tableflip:': '(╯°□°）╯︵ ┻━┻',
  ':unflip:': '┬─┬ノ( º _ ºノ)',
  ':lenny:': '( ͡° ͜ʖ ͡°)',
  ':disapprove:': 'ಠ_ಠ',
  ':happy:': '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
  ':cat:': '(=^・ω・^=)',
  ':hug:': '(っ´▽`)っ',
  ':cry:': '(╥﹏╥)',
  ':sparkles:': '✧･ﾟ: *✧･ﾟ:*',
  ':angry:': '(╬ಠ益ಠ)',
  ':blush:': '(⁄ ⁄•⁄ω⁄•⁄ ⁄)',
};

const SHORTCODE_RE = /:[a-z]+:/g;

let cleanupOutgoing: (() => void) | null = null;
let expandedCount = 0;

export default definePlugin({
  start() {
    cleanupOutgoing = patchOutgoingMessageContent((content) => {
      if (!content.includes(':')) {
        return content;
      }
      return transformOutsideCode(content, (segment) =>
        segment.replace(SHORTCODE_RE, (token) => {
          const replacement = KAOMOJI_MAP[token];
          if (!replacement) {
            return token;
          }
          expandedCount += 1;
          return replacement;
        }),
      );
    });
  },

  stop() {
    if (cleanupOutgoing) {
      cleanupOutgoing();
      cleanupOutgoing = null;
    }
  },
});
