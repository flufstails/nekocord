import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

const BLOCKED_CALL_IDLE = new Set([
  'CALL_IDLE_DISCONNECT',
  'VOICE_IDLE_DISCONNECT',
  'RING_IDLE_TIMEOUT',
]);

export default createDispatcherBlockerPlugin((action) => BLOCKED_CALL_IDLE.has(action.type));
