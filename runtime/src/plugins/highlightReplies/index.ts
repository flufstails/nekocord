import { createRowPlugin, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
  if (row.backgroundHighlight) return false;
  if (msg.referencedMessage && typeof msg.referencedMessage === 'object') {
    row.backgroundHighlight = {
      backgroundColor: ROW_COLOURS.blurpleBg,
      gutterColor: ROW_COLOURS.blurpleGutter,
    };
    return true;
  }
  return false;
});
