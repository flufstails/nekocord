import { createRowPlugin, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
      if (msg.mentionEveryone && !row.backgroundHighlight) {
        row.backgroundHighlight = {
          backgroundColor: ROW_COLOURS.amberBg,
          gutterColor: ROW_COLOURS.amberGutter,
        };
        return true;
      }
      return false;
    });
