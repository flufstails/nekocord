import { patchOutgoingMessageContent, transformOutsideCode } from '../../utils/text.js';
import { definePlugin } from '../types.js';

const GREENTEXT_LINE_RE = /^>[^\s>].*$/;

let cleanupOutgoing: (() => void) | null = null;
let formattedCount = 0;

function formatGreentextSegment(segment: string): string {
  const lines = segment.split('\n');
  let changed = false;
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    if (GREENTEXT_LINE_RE.test(lines[i])) {
      const greenBlock: string[] = [];
      while (i < lines.length && GREENTEXT_LINE_RE.test(lines[i])) {
        greenBlock.push(`\u001b[0;32m${lines[i]}`);
        i += 1;
      }
      result.push(`\`\`\`ansi\n${greenBlock.join('\n')}\n\`\`\``);
      changed = true;
      formattedCount += 1;
      continue;
    }
    result.push(lines[i]);
    i += 1;
  }

  return changed ? result.join('\n') : segment;
}

export default definePlugin({
  start() {
    cleanupOutgoing = patchOutgoingMessageContent((content) => {
      if (!content.includes('>')) {
        return content;
      }
      return transformOutsideCode(content, formatGreentextSegment);
    });
  },

  stop() {
    if (cleanupOutgoing) {
      cleanupOutgoing();
      cleanupOutgoing = null;
    }
  },
});
