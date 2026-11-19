import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin(
  (a) => a.type === 'CALL_IDLE_DISCONNECT' || a.type === 'RTC_CONNECTION_IDLE_DISCONNECT',
);
