import { registerMessageRowTransformer } from '../../chat/rows.js';
import { getUserStore } from '../../metro/common.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  mode: {
    type: OptionType.SELECT,
    label: 'Display Mode',
    description: 'Choose how usernames and nicknames appear on incoming chat messages.',
    default: 'nick-user',
    options: [
      { label: 'Nick (@user)', value: 'nick-user' },
      { label: '@user (Nick)', value: 'user-nick' },
      { label: '@user only', value: 'user-only' },
    ],
  },
});

let unregisterRowTransformer: (() => void) | null = null;
let annotatedCount = 0;

export default definePlugin({
  settings,
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

      const mode = settings.store.mode;
      if (mode === 'user-only') {
        if (displayName === `@${handle}` || displayName === handle) {
          return false;
        }
        msg.username = `@${handle}`;
        annotatedCount += 1;
        return true;
      }

      if (handle.toLowerCase() === displayName.trim().toLowerCase()) {
        return false;
      }
      if (displayName.includes(`@${handle}`)) {
        return false;
      }

      msg.username =
        mode === 'user-nick' ? `@${handle} (${displayName})` : `${displayName} (@${handle})`;
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
