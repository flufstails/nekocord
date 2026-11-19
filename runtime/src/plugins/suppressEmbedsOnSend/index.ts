import { before } from '../../patcher/index.js';
import { createMessageActionHookPlugin } from '../_shared/fluxAndPrivacy.js';

export default createMessageActionHookPlugin((actions) => {
      if (typeof actions.sendMessage !== 'function') return [];
      return [
        before(actions, 'sendMessage', (_channelId: any, message: any) => {
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
        }),
      ];
    });
