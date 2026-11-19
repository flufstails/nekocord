import { patchOutgoingMessageContent, transformOutsideCodeAndTokens } from '../../utils/text.js';
import { definePlugin } from '../types.js';

let cleanupOutgoing: (() => void) | null = null;
let transformedCount = 0;

function uwuifyProse(text: string): string {
  return text
    .replace(/ove/g, 'uv')
    .replace(/OVE/g, 'UV')
    .replace(/(?:r|l)/g, 'w')
    .replace(/(?:R|L)/g, 'W')
    .replace(/n([aeiou])/g, 'ny$1')
    .replace(/N([aeiou])/g, 'Ny$1')
    .replace(/N([AEIOU])/g, 'NY$1');
}

export default definePlugin({
  start() {
    cleanupOutgoing = patchOutgoingMessageContent((content) => {
      const next = transformOutsideCodeAndTokens(content, uwuifyProse);
      if (next !== content) {
        transformedCount += 1;
      }
      return next;
    });
  },

  stop() {
    if (cleanupOutgoing) {
      cleanupOutgoing();
      cleanupOutgoing = null;
    }
  },
});
