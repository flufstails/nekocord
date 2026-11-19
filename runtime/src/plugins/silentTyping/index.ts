import { findByProps, waitFor } from '../../metro/index.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let blockedTypingCount = 0;
let cancelWait: (() => void) | null = null;
let unpatchStartTyping: Unpatch | null = null;

/**
 * Returns the number of suppressed typing indicator broadcasts.
 */
export function getBlockedTypingCount(): number {
  return blockedTypingCount;
}

export default definePlugin({
  start() {
    const patchTyping = (mod: any) => {
      if (unpatchStartTyping || typeof mod?.startTyping !== 'function') {
        return;
      }
      unpatchStartTyping = instead(mod, 'startTyping', () => {
        blockedTypingCount += 1;
        return undefined;
      });
    };

    const existing = findByProps('startTyping', 'stopTyping');
    if (existing) {
      patchTyping(existing);
    } else {
      cancelWait = waitFor(
        (m) =>
          typeof m === 'object' &&
          m !== null &&
          typeof m.startTyping === 'function' &&
          typeof m.stopTyping === 'function',
        patchTyping,
      );
    }
  },

  stop() {
    if (cancelWait) {
      cancelWait();
      cancelWait = null;
    }
    if (unpatchStartTyping) {
      unpatchStartTyping();
      unpatchStartTyping = null;
    }
  },
});
