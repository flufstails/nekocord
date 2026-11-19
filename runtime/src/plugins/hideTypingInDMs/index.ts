import { getChannelStore } from '../../metro/common.js';
import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin((action) => {
  if (action.type !== 'TYPING_START' && action.type !== 'CHANNEL_START_TYPING') return false;
  const ch = action.channelId ? getChannelStore()?.getChannel?.(String(action.channelId)) : null;
  return Boolean(ch && (ch.type === 1 || ch.type === 3));
});
