import { getUserStore } from '../../metro/common.js';
import { pushNotification } from '../../notifications/index.js';
import { createDispatcherObserverPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherObserverPlugin('RELATIONSHIP_ADD', (action) => {
  const rel = action.relationship;
  if (!rel || !rel.id) return;
  const u = getUserStore()?.getUser?.(String(rel.id));
  const label = u?.globalName || u?.username || String(rel.id);
  const body =
    rel.type === 1
      ? `You are now friends with ${label}.`
      : rel.type === 3
        ? `${label} sent you a friend request.`
        : `Updated relationship with ${label}.`;
  pushNotification({
    title: 'Relationship Event',
    body,
    source: 'FriendRequestLogger',
    kind: 'discord',
    showToast: rel.type === 1 || rel.type === 3,
  });
});
