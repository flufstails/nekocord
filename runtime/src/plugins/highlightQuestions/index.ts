import { createRowPlugin, extractMessageText, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
  if (row.backgroundHighlight) return false;
  const text = extractMessageText(msg).trim();
  if (text.length >= 4 && text.charAt(text.length - 1) === '?') {
    row.backgroundHighlight = {
      backgroundColor: ROW_COLOURS.cyanBg,
      gutterColor: ROW_COLOURS.cyanGutter,
    };
    return true;
  }
  return false;
});
