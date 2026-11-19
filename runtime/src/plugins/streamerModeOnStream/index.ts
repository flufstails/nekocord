import { getUserStore, onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { definePlugin } from '../types.js';

let cancelWait: (() => void) | null = null;
let dispatcherRef: FluxDispatcher | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

function isOwnStreamEvent(action: Record<string, any> | undefined): boolean {
  const selfId = getUserStore()?.getCurrentUser?.()?.id;
  if (!selfId) return false;
  const uid = action?.userId != null ? String(action.userId) : '';
  const key = typeof action?.streamKey === 'string' ? action.streamKey : '';
  return uid === String(selfId) || key.endsWith(`:${String(selfId)}`);
}

function scheduleStreamerMode(enabled: boolean, action: Record<string, any> | undefined) {
  if (!isOwnStreamEvent(action)) return;
  if (pendingTimer) {
    clearTimeout(pendingTimer);
  }
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    dispatcherRef?.dispatch({ type: 'STREAMER_MODE_UPDATE', enabled });
  }, 0);
}

const onStreamStart = (action: Record<string, any>) => scheduleStreamerMode(true, action);
const onStreamStop = (action: Record<string, any>) => scheduleStreamerMode(false, action);

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
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingTimer = null;
    }
    cancelWait?.();
    cancelWait = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('STREAM_CREATE', onStreamStart);
      dispatcherRef.unsubscribe('STREAM_DELETE', onStreamStop);
      dispatcherRef = null;
    }
  },
});
