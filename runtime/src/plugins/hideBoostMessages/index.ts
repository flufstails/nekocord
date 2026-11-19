import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin(
  (a) =>
    a.type === 'MESSAGE_CREATE' &&
    typeof a.message?.type === 'number' &&
    a.message.type >= 8 &&
    a.message.type <= 11,
);
