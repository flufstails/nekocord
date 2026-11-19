import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin(
  (action) => action.type === 'LOCAL_ACTIVITY_UPDATE' || action.type === 'RUNNING_GAMES_CHANGE',
);
