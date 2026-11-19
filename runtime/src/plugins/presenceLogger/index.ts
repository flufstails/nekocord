import { getRelationshipStore, getUserStore, onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { pushNotification } from '../../notifications/index.js';
import { definePlugin } from '../types.js';

const lastStatuses = new Map<string, string>();
let dispatcherRef: FluxDispatcher | null = null;
let cancelWait: (() => void) | null = null;

const onPresence = (action: Record<string, any>) => {
  const updates = Array.isArray(action.updates) ? action.updates : action.user ? [action] : [];
  const relStore = getRelationshipStore();
  const userStore = getUserStore();
  for (let i = 0; i < updates.length; i += 1) {
    const u = updates[i];
    const uid = u?.user?.id ? String(u.user.id) : '';
    const status = typeof u?.status === 'string' ? u.status : '';
    if (!uid || !status) continue;
    if (relStore && typeof relStore.isFriend === 'function' && !relStore.isFriend(uid)) continue;
    const prev = lastStatuses.get(uid);
    lastStatuses.set(uid, status);
    if (prev && prev !== status) {
      const user = userStore?.getUser?.(uid);
      const name = user?.globalName || user?.username || uid;
      pushNotification({
        title: 'Presence Update',
        body: `${name} changed status: ${prev} -> ${status}`,
        source: 'PresenceLogger',
        kind: 'info',
        showToast: false,
      });
    }
  }
};

export default definePlugin({
  start() {
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (!dispatcherRef) {
        dispatcherRef = dispatcher;
        dispatcher.subscribe('PRESENCE_UPDATE', onPresence);
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('PRESENCE_UPDATE', onPresence);
      dispatcherRef = null;
    }
    lastStatuses.clear();
  },
});
