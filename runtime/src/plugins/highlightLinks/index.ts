import { createRowPlugin, extractMessageText, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
  if (row.backgroundHighlight) return false;
  const text = extractMessageText(msg);
  if (/https?:\/\/[^\s<>]+/i.test(text)) {
    row.backgroundHighlight = {
      backgroundColor: ROW_COLOURS.mintBg,
      gutterColor: ROW_COLOURS.mintGutter,
    };
    return true;
  }
  return false;
});
