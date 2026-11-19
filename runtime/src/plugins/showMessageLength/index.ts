import { appendTimestampNote, createRowPlugin, extractMessageText } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  const len = extractMessageText(msg).length;
  if (len < 120) return false;
  return appendTimestampNote(msg, `[${len}c]`);
});
