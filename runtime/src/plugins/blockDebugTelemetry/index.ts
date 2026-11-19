import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin(
  (a) =>
    a.type === 'DEBUG_LOG' ||
    a.type === 'DIAGNOSTIC_LOG' ||
    a.type === 'PERFORMANCE_TRACE',
);
