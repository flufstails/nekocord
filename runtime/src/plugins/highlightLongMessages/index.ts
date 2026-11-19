import { createRowPlugin, extractMessageText, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
  if (row.backgroundHighlight) return false;
  if (extractMessageText(msg).length >= 350) {
    row.backgroundHighlight = {
      backgroundColor: ROW_COLOURS.cyanBg,
      gutterColor: ROW_COLOURS.cyanGutter,
    };
    return true;
  }
  return false;
});
