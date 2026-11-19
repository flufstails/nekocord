import { registerMessageRowTransformer } from '../../chat/rows.js';
import { definePlugin } from '../types.js';

let unregisterRowTransformer: (() => void) | null = null;
let appliedCount = 0;

export default definePlugin({
  start() {
    unregisterRowTransformer = registerMessageRowTransformer((row) => {
      const msg = row.message;
      if (!msg || typeof msg !== 'object') {
        return false;
      }
      if (msg.roleColor == null && msg.roleColors == null) {
        return false;
      }
      if (msg.shouldShowRoleDot === true && msg.shouldShowRoleOnName === true) {
        return false;
      }
      msg.shouldShowRoleDot = true;
      msg.shouldShowRoleOnName = true;
      appliedCount += 1;
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
