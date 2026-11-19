import { appendTimestampNote, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (typeof msg.id !== 'string' || msg.id.length < 8) return false;
  return appendTimestampNote(msg, `[#${msg.id.slice(-6)}]`);
});
