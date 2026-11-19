import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

const BLOCKED_ACTIVITY_EVENTS = new Set([
  'LOCAL_ACTIVITY_UPDATE',
  'RUNNING_GAMES_CHANGE',
  'SELF_PRESENCE_STORE_UPDATE',
]);

export default createDispatcherBlockerPlugin((action) => BLOCKED_ACTIVITY_EVENTS.has(action.type));
