import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin((a) => a.type === 'PRESENCE_TRACKING' || a.type === 'ACTIVITY_LAUNCH_METRICS');
