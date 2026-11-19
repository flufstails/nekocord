import { patchOutgoingMessageContent } from '../../utils/text.js';
import { definePlugin } from '../types.js';

let unpatch: (() => void) | null = null;

export default definePlugin({
  start() {
    unpatch = patchOutgoingMessageContent((content, channelId) => {
      if (!content || content.indexOf('\\cid') === -1 || !channelId) return content;
      return content.split('\\cid').join(channelId);
    });
  },
  stop() {
    unpatch?.();
    unpatch = null;
  },
});
