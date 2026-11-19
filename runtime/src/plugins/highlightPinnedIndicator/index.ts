import { appendTimestampNote, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!msg.pinned) return false;
  return appendTimestampNote(msg, '[pinned]');
});
