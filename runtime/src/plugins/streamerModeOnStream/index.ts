import { onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { definePlugin } from '../types.js';

let cancelWait: (() => void) | null = null;
let dispatcherRef: FluxDispatcher | null = null;

function setStreamerMode(enabled: boolean) {
  dispatcherRef?.dispatch({ type: 'STREAMER_MODE_UPDATE', enabled });
}

const onStreamStart = () => setStreamerMode(true);
const onStreamStop = () => setStreamerMode(false);

export default definePlugin({
  start() {
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (!dispatcherRef) {
        dispatcherRef = dispatcher;
        dispatcher.subscribe('STREAM_CREATE', onStreamStart);
        dispatcher.subscribe('STREAM_DELETE', onStreamStop);
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('STREAM_CREATE', onStreamStart);
      dispatcherRef.unsubscribe('STREAM_DELETE', onStreamStop);
      dispatcherRef = null;
    }
  },
});
