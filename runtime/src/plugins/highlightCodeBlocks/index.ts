import { createRowPlugin, extractMessageText, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
  if (row.backgroundHighlight) return false;
  if (extractMessageText(msg).indexOf('```') !== -1) {
    row.backgroundHighlight = {
      backgroundColor: ROW_COLOURS.purpleBg,
      gutterColor: ROW_COLOURS.purpleGutter,
    };
    return true;
  }
  return false;
});
