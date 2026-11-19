import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin((a) => a.type === 'VOICE_CHANNEL_STATUS_UPDATE');
