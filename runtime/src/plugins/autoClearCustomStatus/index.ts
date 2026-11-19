import { onFluxDispatcher } from '../../metro/common.js';
import { definePlugin } from '../types.js';

let cancelWait: (() => void) | null = null;
let cleared = false;

export default definePlugin({
  start() {
    cleared = false;
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (cleared) return;
      cleared = true;
      dispatcher.dispatch({
        type: 'LOCAL_ACTIVITY_UPDATE',
        activity: null,
        socketId: 'CustomStatus',
      });
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
  },
});
