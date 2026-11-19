import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin((a) => a.type === 'CHANNEL_OPENED' || a.type === 'THREAD_NAVIGATE');
