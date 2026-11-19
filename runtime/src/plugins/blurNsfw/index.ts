import { getChannelStore } from '../../metro/common.js';
import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.attachments) || msg.attachments.length === 0 || !msg.channelId) {
    return false;
  }
  const ch = getChannelStore()?.getChannel?.(String(msg.channelId));
  if (!ch?.nsfw) {
    return false;
  }
  let changed = false;
  for (let i = 0; i < msg.attachments.length; i += 1) {
    const att = msg.attachments[i];
    if (att && typeof att === 'object' && att.isSpoiler !== true) {
      att.isSpoiler = true;
      att.spoiler = true;
      changed = true;
    }
  }
  return changed;
});
