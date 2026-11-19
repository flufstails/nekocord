import { registerMessageRowTransformer } from '../../chat/rows.js';
import { getUserStore } from '../../metro/common.js';
import { definePlugin } from '../types.js';

let unregisterRowTransformer: (() => void) | null = null;
let annotatedCount = 0;

export default definePlugin({
  start() {
    unregisterRowTransformer = registerMessageRowTransformer((row) => {
      const msg = row.message;
      if (!msg || typeof msg !== 'object') {
        return false;
      }
      const authorId = msg.authorId != null ? String(msg.authorId) : '';
      const displayName = typeof msg.username === 'string' ? msg.username : '';
      if (!authorId || !displayName) {
        return false;
      }

      const user = getUserStore()?.getUser?.(authorId);
      const handle = typeof user?.username === 'string' ? user.username.trim() : '';
      if (!handle) {
        return false;
      }
      if (handle.toLowerCase() === displayName.trim().toLowerCase()) {
        return false;
      }
      const suffix = `(@${handle})`;
      if (displayName.includes(suffix)) {
        return false;
      }

      msg.username = `${displayName} ${suffix}`;
      annotatedCount += 1;
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
