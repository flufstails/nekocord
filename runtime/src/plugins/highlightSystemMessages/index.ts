import { createRowPlugin, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
  if (row.backgroundHighlight) return false;
  if (typeof msg.type === 'number' && msg.type !== 0 && msg.type !== 19) {
    row.backgroundHighlight = {
      backgroundColor: ROW_COLOURS.purpleBg,
      gutterColor: ROW_COLOURS.purpleGutter,
    };
    return true;
  }
  return false;
});
