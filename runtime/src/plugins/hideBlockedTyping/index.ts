import { getRelationshipStore } from '../../metro/common.js';
import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin((action) => {
  if (action.type !== 'TYPING_START' || !action.userId) return false;
  const store = getRelationshipStore();
  const id = String(action.userId);
  return Boolean(store?.isBlockedOrIgnored?.(id) || store?.isBlocked?.(id));
});
