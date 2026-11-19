import { registerMessageRowTransformer } from '../../chat/rows.js';
import { definePlugin } from '../types.js';

let unregisterRowTransformer: (() => void) | null = null;
let strippedCount = 0;

export default definePlugin({
  start() {
    unregisterRowTransformer = registerMessageRowTransformer((row) => {
      const msg = row.message;
      if (msg && typeof msg === 'object' && msg.showLinkDecorations === true) {
        msg.showLinkDecorations = false;
        strippedCount += 1;
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
