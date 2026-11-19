import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin(
  (a) => a.type === 'MESSAGE_CREATE' && a.message?.type === 18,
);
