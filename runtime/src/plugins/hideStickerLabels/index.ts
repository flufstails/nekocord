import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.stickerItems) || msg.stickerItems.length === 0) return false;
  let changed = false;
  for (let i = 0; i < msg.stickerItems.length; i += 1) {
    const item = msg.stickerItems[i];
    if (item && typeof item === 'object' && item.description) {
      item.description = '';
      changed = true;
    }
  }
  return changed;
});
