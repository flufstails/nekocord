import { instead } from '../../patcher/index.js';
import { createMessageActionHookPlugin } from '../_shared/fluxAndPrivacy.js';

export default createMessageActionHookPlugin((actions) => {
      if (typeof actions.editMessage !== 'function' || typeof actions.deleteMessage !== 'function') {
        return [];
      }
      return [
        instead(actions, 'editMessage', (args, orig) => {
          const channelId = args[0];
          const messageId = args[1];
          const msg = args[2];
          if (msg && typeof msg.content === 'string' && msg.content.trim().length === 0) {
            return actions.deleteMessage(channelId, messageId);
          }
          return orig(...args);
        }),
      ];
    });
