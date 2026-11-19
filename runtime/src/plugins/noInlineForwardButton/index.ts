import { registerMessageRowTransformer } from '../../chat/rows.js';
import { definePlugin } from '../types.js';

let unregisterRowTransformer: (() => void) | null = null;
let hiddenCount = 0;

export default definePlugin({
  start() {
    unregisterRowTransformer = registerMessageRowTransformer((row) => {
      const msg = row.message;
      if (msg && typeof msg === 'object' && msg.showInlineForwardButton === true) {
        msg.showInlineForwardButton = false;
        hiddenCount += 1;
        return true;
      }
      return false;
    });
  },

  stop() {
    if (unregisterRowTransformer) {
      unregisterRowTransformer();
      unregisterRowTransformer = null;
    }
  },
});
