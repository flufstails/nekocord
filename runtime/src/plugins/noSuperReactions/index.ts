import { registerMessageRowTransformer } from '../../chat/rows.js';
import { definePlugin } from '../types.js';

let unregisterRowTransformer: (() => void) | null = null;
let flattenedCount = 0;

export default definePlugin({
  start() {
    unregisterRowTransformer = registerMessageRowTransformer((row) => {
      const msg = row.message;
      if (!msg || typeof msg !== 'object' || !Array.isArray(msg.reactions)) {
        return false;
      }

      let changed = false;
      for (let i = 0; i < msg.reactions.length; i += 1) {
        const reaction = msg.reactions[i];
        if (!reaction || typeof reaction !== 'object') {
          continue;
        }
        const burstCount = typeof reaction.burst_count === 'number' ? reaction.burst_count : 0;
        if (burstCount > 0 || reaction.me_burst || reaction.themedBurstColors != null) {
          const baseCount = typeof reaction.count === 'number' ? reaction.count : 0;
          reaction.count = Math.max(1, baseCount + burstCount);
          reaction.burst_count = 0;
          reaction.me_burst = false;
          delete reaction.themedBurstColors;
          flattenedCount += 1;
          changed = true;
        }
      }

      return changed;
    });
  },

  stop() {
    if (unregisterRowTransformer) {
      unregisterRowTransformer();
      unregisterRowTransformer = null;
    }
  },
});
