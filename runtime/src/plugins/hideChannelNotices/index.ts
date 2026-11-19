import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin((a) =>
      a.type === 'CHANNEL_NOTICE_SHOW' || a.type === 'DISMISSIBLE_CONTENT_DISPLAYED');
