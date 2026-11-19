import { patchOutgoingMessageContent, transformOutsideCodeAndTokens } from '../../utils/text.js';
import { definePlugin } from '../types.js';

const ALPHA_RE = /[a-zA-Z]/;

let cleanupOutgoing: (() => void) | null = null;
let mockedCount = 0;

function toMockingCase(text: string): string {
  let upper = false;
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ALPHA_RE.test(ch)) {
      out += upper ? ch.toUpperCase() : ch.toLowerCase();
      upper = !upper;
    } else {
      out += ch;
    }
  }
  return out;
}

export default definePlugin({
  start() {
    cleanupOutgoing = patchOutgoingMessageContent((content) => {
      const next = transformOutsideCodeAndTokens(content, toMockingCase);
      if (next !== content) {
        mockedCount += 1;
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
