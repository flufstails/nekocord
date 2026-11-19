import { onFluxDispatcher } from '../../metro/common.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let cancelDispatcherWait: (() => void) | null = null;
let unpatchDispatch: Unpatch | null = null;
let hiddenCount = 0;

export default definePlugin({
  start() {
    cancelDispatcherWait = onFluxDispatcher((dispatcher) => {
      if (unpatchDispatch) {
        return;
      }
      unpatchDispatch = instead(dispatcher, 'dispatch', (args: any[], orig: (...a: any[]) => any) => {
        const action = args[0];
        if (action && typeof action === 'object' && action.type === 'TYPING_START') {
          hiddenCount += 1;
          return undefined;
        }
        return orig(...args);
      });
    });
  },

  stop() {
    if (cancelDispatcherWait) {
      cancelDispatcherWait();
      cancelDispatcherWait = null;
    }
    if (unpatchDispatch) {
      unpatchDispatch();
      unpatchDispatch = null;
    }
  },
});
