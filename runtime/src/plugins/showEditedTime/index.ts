import { appendTimestampNote, createRowPlugin, pad2 } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!msg.editedTimestamp) return false;
  const d = new Date(msg.editedTimestamp);
  if (isNaN(d.getTime())) return false;
  const tag = `(edited ${pad2(d.getHours())}:${pad2(d.getMinutes())})`;
  return appendTimestampNote(msg, tag);
});
