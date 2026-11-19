import { onHttpClient, onMessageActions } from '../../metro/common.js';
import { before, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const SILENT_PREFIX_RE = /^@silent(?:\s|$)/i;
const MESSAGES_POST_RE = /^\/?channels\/\d+\/messages(?:$|\?)/;
const SUPPRESS_NOTIFICATIONS_FLAG = 4096;

const cleanups: Array<() => void> = [];
let silencedCount = 0;

function applySilentSend(message: any, httpMode: boolean): void {
  if (!message || typeof message !== 'object') return;
  if (httpMode) {
    const curFlags = Number(message.flags) || 0;
    if ((curFlags & SUPPRESS_NOTIFICATIONS_FLAG) === 0 && typeof message.content === 'string' && message.content.trim().length > 0) {
      if (SILENT_PREFIX_RE.test(message.content)) {
        message.content = message.content.replace(SILENT_PREFIX_RE, '').replace(/^\s+/, '');
      }
      message.flags = curFlags | SUPPRESS_NOTIFICATIONS_FLAG;
      silencedCount += 1;
    }
    return;
  }
  if (
    typeof message.content === 'string' &&
    message.content.trim().length > 0 &&
    !SILENT_PREFIX_RE.test(message.content)
  ) {
    message.content = `@silent ${message.content}`;
    silencedCount += 1;
  }
}

export default definePlugin({
  start() {
    if (cleanups.length > 0) return;

    cleanups.push(
      onMessageActions((actions: any) => {
        if (typeof actions.sendMessage === 'function') {
          cleanups.push(
            before(actions, 'sendMessage', (_channelId: any, message: any) => {
              applySilentSend(message, false);
            }),
          );
        }
        if (typeof actions._sendMessage === 'function') {
          cleanups.push(
            before(actions, '_sendMessage', (_channelId: any, message: any) => {
              applySilentSend(message, false);
            }),
          );
        }
      }),
    );

    cleanups.push(
      onHttpClient((http: any) => {
        if (typeof http?.post === 'function') {
          cleanups.push(
            before(http, 'post', (req: any) => {
              if (req && typeof req.url === 'string' && MESSAGES_POST_RE.test(req.url)) {
                applySilentSend(req.body, true);
              }
            }),
          );
        }
      }),
    );
  },

  stop() {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
  },
});
