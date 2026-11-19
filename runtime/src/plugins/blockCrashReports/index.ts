import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin(
  (action) =>
    action.type === 'REPORT_CRASH' ||
    action.type === 'SENTRY_CAPTURE' ||
    action.type === 'CLIENT_ANALYTICS_EVENT',
);
