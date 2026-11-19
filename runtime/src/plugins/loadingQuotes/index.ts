import { watchNamedExports } from '../../metro/index.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  customQuote: {
    type: OptionType.STRING,
    label: 'Custom Loading Quote',
    description: 'Override rotating Nekocord splash messages with your own line.',
    default: '',
    placeholder: 'Optional custom loading quote',
  },
});

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
  settings,
  start() {
    cancelWatch = watchNamedExports(new Set(['getRandomTip', 'getLoadingTip']), (hit) => {
      try {
        unpatches.push(
          instead(hit.target, hit.key, () => {
            const custom = settings.store.customQuote.trim();
            if (custom) {
              return custom;
            }
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
