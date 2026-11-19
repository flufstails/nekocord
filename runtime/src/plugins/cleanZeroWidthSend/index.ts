import { before } from '../../patcher/index.js';
import { createMessageActionHookPlugin } from '../_shared/fluxAndPrivacy.js';

const ZERO_WIDTH_CLEAN_RE = /[\u200B-\u200D\uFEFF]/g;

export default createMessageActionHookPlugin((actions) => {
      if (typeof actions.sendMessage !== 'function') return [];
      return [
        before(actions, 'sendMessage', (_channelId: any, message: any) => {
          if (message && typeof message.content === 'string') {
            const next = message.content.replace(ZERO_WIDTH_CLEAN_RE, '');
            if (next !== message.content) {
              message.content = next;
              }
          }
        }),
      ];
    });
