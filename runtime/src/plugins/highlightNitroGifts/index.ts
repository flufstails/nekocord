import { createRowPlugin, extractMessageText, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
  if (row.backgroundHighlight) return false;
  if (/discord\.gift\/[A-Za-z0-9]+/i.test(extractMessageText(msg))) {
    row.backgroundHighlight = {
      backgroundColor: ROW_COLOURS.mintBg,
      gutterColor: ROW_COLOURS.mintGutter,
    };
    return true;
  }
  return false;
});
