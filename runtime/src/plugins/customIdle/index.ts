import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin(
  (action) => action.type === 'IDLE' && action.idle === true,
);
