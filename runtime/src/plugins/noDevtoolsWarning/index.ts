import { interceptFluxDispatcher } from '../../metro/common.js';
import { definePlugin } from '../types.js';

let origWarn: ((...a: any[]) => void) | null = null;
let stopIntercept: (() => void) | null = null;

export default definePlugin({
  start() {
    origWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Hold Up!')) return;
      origWarn?.apply(console, args);
    };
    if (!stopIntercept) {
      stopIntercept = interceptFluxDispatcher((action, args, orig) => {
        if (action.type === 'SHOW_DEVTOOLS_WARNING') return undefined;
        return orig(...args);
      });
    }
  },
  stop() {
    if (origWarn) {
      console.warn = origWarn;
      origWarn = null;
    }
    stopIntercept?.();
    stopIntercept = null;
  },
});
