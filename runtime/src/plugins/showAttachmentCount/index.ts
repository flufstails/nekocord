import { appendTimestampNote, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.attachments) || msg.attachments.length < 2) return false;
  return appendTimestampNote(msg, `[${msg.attachments.length} files]`);
});
