import { registerMessageRowTransformer } from '../../chat/rows.js';
import { watchNamedExports } from '../../metro/index.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const TARGET_NAMES = new Set(['getAvatarDecoration']);

let unregisterRowTransformer: (() => void) | null = null;
let cancelWatch: (() => void) | null = null;
const unpatches: Unpatch[] = [];
let strippedCount = 0;

export default definePlugin({
  start() {
    unregisterRowTransformer = registerMessageRowTransformer((row) => {
      const msg = row.message;
      if (msg && typeof msg === 'object' && msg.avatarDecorationURL) {
        delete msg.avatarDecorationURL;
        strippedCount += 1;
        return true;
      }
      return false;
    });

    cancelWatch = watchNamedExports(TARGET_NAMES, (hit) => {
      try {
        unpatches.push(
          instead(hit.target, hit.key, () => {
            strippedCount += 1;
            return null;
          }),
        );
      } catch {
        // Ignore locked export properties.
      }
    });
  },

  stop() {
    if (unregisterRowTransformer) {
      unregisterRowTransformer();
      unregisterRowTransformer = null;
    }
    if (cancelWatch) {
      cancelWatch();
      cancelWatch = null;
    }
    while (unpatches.length > 0) {
      const fn = unpatches.pop();
      fn?.();
    }
  },
});
