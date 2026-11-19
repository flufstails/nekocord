import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin(
  (action) =>
    action.type === 'STREAM_PREVIEW_UPDATE' || action.type === 'STREAM_UPDATE_THUMBNAIL',
);
