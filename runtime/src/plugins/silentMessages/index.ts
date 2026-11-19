import { onMessageActions } from '../../metro/common.js';
import { before, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const SILENT_PREFIX_RE = /^@silent(?:\s|$)/i;

let cancelWait: (() => void) | null = null;
let unpatchSend: Unpatch | null = null;
let silencedCount = 0;

export default definePlugin({
  start() {
    cancelWait = onMessageActions((actions) => {
      if (unpatchSend || typeof actions.sendMessage !== 'function') {
        return;
      }
      unpatchSend = before(actions, 'sendMessage', (_channelId: any, message: any) => {
        if (
          message &&
          typeof message.content === 'string' &&
          message.content.trim().length > 0 &&
          !SILENT_PREFIX_RE.test(message.content)
        ) {
          message.content = `@silent ${message.content}`;
          silencedCount += 1;
        }
      });
    });
  },

  stop() {
    if (cancelWait) {
      cancelWait();
      cancelWait = null;
    }
    if (unpatchSend) {
      unpatchSend();
      unpatchSend = null;
    }
  },
});
