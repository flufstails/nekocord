import { appendTimestampNote, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.embeds) || msg.embeds.length < 2) return false;
  return appendTimestampNote(msg, `[${msg.embeds.length} embeds]`);
});
