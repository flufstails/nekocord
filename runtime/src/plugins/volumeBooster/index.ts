import { waitForStore } from '../../metro/index.js';
import { after, type Unpatch } from '../../patcher/index.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  maxVolume: {
    type: OptionType.SELECT,
    label: 'Max Boost Level',
    description: 'Highest volume limit allowed for people in voice calls.',
    default: 400,
    options: [
      { label: '200%', value: 200 },
      { label: '300%', value: 300 },
      { label: '400%', value: 400 },
    ],
  },
});

let cancelWait: (() => void) | null = null;
let unpatch: Unpatch | null = null;

export default definePlugin({
  settings,
  start() {
    cancelWait = waitForStore('MediaEngineStore', (store) => {
      if (unpatch || typeof store.getLocalVolume !== 'function') return;
      try {
        unpatch = after(store, 'getLocalVolume', (_args, vol) => {
          if (typeof vol === 'number' && Number.isFinite(vol) && vol > 200) {
            return Math.min(vol, Number(settings.store.maxVolume));
          }
          return vol;
        });
      } catch {
        // Ignore locked MediaEngineStore methods.
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    unpatch?.();
    unpatch = null;
  },
});
