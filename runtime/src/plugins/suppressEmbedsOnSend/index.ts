import { onHttpClient, onMessageActions } from '../../metro/common.js';
import { before } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const MESSAGES_POST_RE = /^\/?channels\/\d+\/messages(?:$|\?)/;
const cleanups: Array<() => void> = [];

function applySuppressEmbeds(message: any): void {
  if (
    message &&
    typeof message === 'object' &&
    typeof message.content === 'string' &&
    /https?:\/\//i.test(message.content)
  ) {
    const flags = typeof message.flags === 'number' ? message.flags : 0;
    if ((flags & 4) === 0) {
      message.flags = flags | 4;
    }
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
              applySuppressEmbeds(message);
            }),
          );
        }
        if (typeof actions._sendMessage === 'function') {
          cleanups.push(
            before(actions, '_sendMessage', (_channelId: any, message: any) => {
              applySuppressEmbeds(message);
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
                applySuppressEmbeds(req.body);
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
