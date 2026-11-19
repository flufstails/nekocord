import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin((a) =>
      a.type === 'MEDIA_ENGINE_CONNECTION_STATS' ||
      a.type === 'VOICE_STATE_TRACK' ||
      a.type === 'RTC_CONNECTION_VIDEO');
