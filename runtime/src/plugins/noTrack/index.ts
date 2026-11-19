import { onFluxDispatcher } from '../../metro/common.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  disableAnalytics: {
    type: OptionType.BOOLEAN,
    label: 'Block Discord Analytics',
    description: 'Stop Discord from tracking your app usage and sending analytics.',
    default: true,
  },
  disableScience: {
    type: OptionType.BOOLEAN,
    label: 'Block Science & Experiment Tracking',
    description: 'Stop Discord from logging which experiments and features you test.',
    default: true,
  },
});

let blockedCount = 0;
let cancelWait: (() => void) | null = null;
let unpatchDispatch: Unpatch | null = null;

export function getBlockedTrackingCount(): number {
  return blockedCount;
}

export default definePlugin({
  settings,
  start() {
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (unpatchDispatch) {
        return;
      }
      unpatchDispatch = instead(dispatcher, 'dispatch', (args, orig) => {
        const action = args[0] as { type?: unknown } | undefined;
        const type = typeof action?.type === 'string' ? action.type : '';
        if (settings.store.disableAnalytics && (type === 'TRACK' || type.startsWith('ANALYTICS_'))) {
          blockedCount += 1;
          return undefined;
        }
        if (
          settings.store.disableScience &&
          (type.startsWith('SCIENCE_') || type === 'EXPERIMENTS_FETCH_TRACK')
        ) {
          blockedCount += 1;
          return undefined;
        }
        return orig(...args);
      });
    });
  },

  stop() {
    if (cancelWait) {
      cancelWait();
      cancelWait = null;
    }
    if (unpatchDispatch) {
      unpatchDispatch();
      unpatchDispatch = null;
    }
  },
});
