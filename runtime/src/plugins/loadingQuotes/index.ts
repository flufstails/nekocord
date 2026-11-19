import { watchNamedExports } from '../../metro/index.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const QUOTES = [
  'Paws on the gateway, everything looks cozy.',
  'Grooming your plugins and warming the themes...',
  'Certified 100% science-free telemetry.',
  'Purring softly while Discord renders chat rows.',
];

let cancelWatch: (() => void) | null = null;
const unpatches: Unpatch[] = [];
let idx = 0;

export default definePlugin({
  start() {
    cancelWatch = watchNamedExports(new Set(['getRandomTip', 'getLoadingTip']), (hit) => {
      try {
        unpatches.push(
          instead(hit.target, hit.key, () => {
            const pick = QUOTES[idx % QUOTES.length];
            idx += 1;
            return pick;
          }),
        );
      } catch {
        // Ignore locked exports.
      }
    });
  },
  stop() {
    cancelWatch?.();
    cancelWatch = null;
    while (unpatches.length > 0) unpatches.pop()?.();
  },
});
