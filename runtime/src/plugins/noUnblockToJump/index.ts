import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin(
  (action) =>
    action.type === 'OPEN_BLOCKED_USER_JUMP_MODAL' ||
    action.type === 'BLOCKED_MESSAGE_JUMP_CONFIRM',
);
