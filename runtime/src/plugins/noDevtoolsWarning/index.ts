import { onFluxDispatcher } from '../../metro/common.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let origWarn: ((...a: any[]) => void) | null = null;
let cancelDisp: (() => void) | null = null;
let unpatchDisp: Unpatch | null = null;

export default definePlugin({
  start() {
    origWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Hold Up!')) return;
      origWarn?.apply(console, args);
    };
    cancelDisp = onFluxDispatcher((dispatcher) => {
      if (unpatchDisp) return;
      unpatchDisp = instead(dispatcher, 'dispatch', (args, orig) => {
        if (args[0]?.type === 'SHOW_DEVTOOLS_WARNING') return undefined;
        return orig(...args);
      });
    });
  },
  stop() {
    if (origWarn) {
      console.warn = origWarn;
      origWarn = null;
    }
    cancelDisp?.();
    cancelDisp = null;
    unpatchDisp?.();
    unpatchDisp = null;
  },
});
