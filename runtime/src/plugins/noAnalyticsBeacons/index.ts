import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin((a) =>
      a.type === 'TRACK' ||
      a.type === 'LOG_EXPOSURE' ||
      a.type === 'CLIENT_HEARTBEAT' ||
      a.type.startsWith('ANALYTICS_') ||
      a.type.startsWith('IMPRESSION_') ||
      a.type.startsWith('SCIENCE_'));
