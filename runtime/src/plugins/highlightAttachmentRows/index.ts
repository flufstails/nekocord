import { createRowPlugin, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
      if (Array.isArray(msg.attachments) && msg.attachments.length > 0 && !row.backgroundHighlight) {
        row.backgroundHighlight = {
          backgroundColor: ROW_COLOURS.cyanBg,
          gutterColor: ROW_COLOURS.cyanGutter,
        };
        return true;
      }
      return false;
    });
