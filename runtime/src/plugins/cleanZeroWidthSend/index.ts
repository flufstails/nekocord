import { patchOutgoingMessageContent } from '../../utils/text.js';
import { definePlugin } from '../types.js';

const ZERO_WIDTH_CLEAN_RE = /[\u200B-\u200D\uFEFF]/g;

let unpatch: (() => void) | null = null;

export default definePlugin({
  start() {
    if (unpatch) return;
    unpatch = patchOutgoingMessageContent((content) => content.replace(ZERO_WIDTH_CLEAN_RE, ''));
  },

  stop() {
    unpatch?.();
    unpatch = null;
  },
});
