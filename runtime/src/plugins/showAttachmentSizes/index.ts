import { appendTimestampNote, createRowPlugin } from '../_shared/chatDisplay.js';

function formatBytes(bytes: number): string {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.attachments) || msg.attachments.length === 0) return false;
  let total = 0;
  for (let i = 0; i < msg.attachments.length; i += 1) {
    const s = Number(msg.attachments[i]?.size);
    if (s > 0) total += s;
  }
  if (total <= 0) return false;
  return appendTimestampNote(msg, `[${formatBytes(total)}]`);
});
