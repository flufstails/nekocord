import { appendTimestampNote, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.stickerItems) || msg.stickerItems.length === 0) return false;
  const first = msg.stickerItems[0];
  const label = first && typeof first.name === 'string' && first.name.trim() ? first.name.trim() : '';
  return label ? appendTimestampNote(msg, `[${label}]`) : false;
});
