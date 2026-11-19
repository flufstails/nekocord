import { patchOutgoingMessageContent, transformOutsideCodeAndTokens } from '../../utils/text.js';
import { definePlugin } from '../types.js';

let cleanupOutgoing: (() => void) | null = null;
let reversedCount = 0;

function reverseString(text: string): string {
  return Array.from(text).reverse().join('');
}

export default definePlugin({
  start() {
    cleanupOutgoing = patchOutgoingMessageContent((content) => {
      const next = transformOutsideCodeAndTokens(content, reverseString);
      if (next !== content) {
        reversedCount += 1;
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
