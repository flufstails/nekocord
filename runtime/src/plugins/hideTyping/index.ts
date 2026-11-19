import { interceptFluxDispatcher } from '../../metro/common.js';
import { definePlugin } from '../types.js';

let stopIntercept: (() => void) | null = null;
let hiddenCount = 0;

export default definePlugin({
  start() {
    if (stopIntercept) return;
    stopIntercept = interceptFluxDispatcher((action, args, orig) => {
      if (action?.type === 'TYPING_START') {
        hiddenCount += 1;
        return undefined;
      }
      return orig(...args);
    });
  },

  stop() {
    stopIntercept?.();
    stopIntercept = null;
  },
});
