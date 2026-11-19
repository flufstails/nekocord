import { patchOutgoingMessageContent, transformOutsideCode } from '../../utils/text.js';
import { definePlugin } from '../types.js';

let unpatch: (() => void) | null = null;

export default definePlugin({
  start() {
    unpatch = patchOutgoingMessageContent((content) =>
      transformOutsideCode(content, (seg) =>
        seg.replace(/\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/gi, '$1'),
      ),
    );
  },
  stop() {
    unpatch?.();
    unpatch = null;
  },
});
