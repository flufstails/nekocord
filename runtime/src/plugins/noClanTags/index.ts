import { registerMessageRowTransformer } from '../../chat/rows.js';
import { definePlugin } from '../types.js';

let unregisterRowTransformer: (() => void) | null = null;
let removedCount = 0;

export default definePlugin({
  start() {
    unregisterRowTransformer = registerMessageRowTransformer((row) => {
      const msg = row.message;
      if (!msg || typeof msg !== 'object') {
        return false;
      }
      if (!msg.clanTag && !msg.clanTagGuildId && !msg.clanBadgeUrl) {
        return false;
      }
      delete msg.clanTag;
      delete msg.clanTagGuildId;
      delete msg.clanBadgeUrl;
      removedCount += 1;
      return true;
    });
  },

  stop() {
    if (unregisterRowTransformer) {
      unregisterRowTransformer();
      unregisterRowTransformer = null;
    }
  },
});
