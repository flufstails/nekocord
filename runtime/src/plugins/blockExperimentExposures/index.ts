import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin(
  (action) => action.type === 'EXPERIMENTS_FETCH_TRACK' || action.type === 'TRACK_EXPOSURE',
);
