import { createRowPlugin, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
      if (msg.tagText && !row.backgroundHighlight) {
        row.backgroundHighlight = {
          backgroundColor: ROW_COLOURS.blurpleBg,
          gutterColor: ROW_COLOURS.blurpleGutter,
        };
        return true;
      }
      return false;
    });
