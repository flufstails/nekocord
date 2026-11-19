import { onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { definePlugin } from '../types.js';

const affinityScores = new Map<string, number>();
let cancelWait: (() => void) | null = null;
let dispatcherRef: FluxDispatcher | null = null;

function recordPeer(action: Record<string, any>) {
  const userId = action?.message?.author?.id ?? action?.userId;
  if (userId) {
    const key = String(userId);
    affinityScores.set(key, (affinityScores.get(key) ?? 0) + 1);
  }
}

export function getImplicitAffinity(userId: string): number {
  return affinityScores.get(userId) ?? 0;
}

export default definePlugin({
  start() {
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (!dispatcherRef) {
        dispatcherRef = dispatcher;
        dispatcher.subscribe('MESSAGE_CREATE', recordPeer);
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('MESSAGE_CREATE', recordPeer);
      dispatcherRef = null;
    }
    affinityScores.clear();
  },
});
