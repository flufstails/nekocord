import { onFluxDispatcher } from '../../metro/common.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let blockedCount = 0;
let cancelWait: (() => void) | null = null;
let unpatchDispatch: Unpatch | null = null;

export function getBlockedTrackingCount(): number {
  return blockedCount;
}

export default definePlugin({
  start() {
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (unpatchDispatch) {
        return;
      }
      unpatchDispatch = instead(dispatcher, 'dispatch', (args, orig) => {
        const action = args[0] as { type?: unknown } | undefined;
        const type = typeof action?.type === 'string' ? action.type : '';
        if (type === 'TRACK' || type.startsWith('ANALYTICS_')) {
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
