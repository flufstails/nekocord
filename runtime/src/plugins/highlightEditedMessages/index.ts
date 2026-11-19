import { createRowPlugin, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
      if (msg.edited && msg.edited !== 'deleted' && !row.backgroundHighlight) {
        row.backgroundHighlight = {
          backgroundColor: ROW_COLOURS.mintBg,
          gutterColor: ROW_COLOURS.mintGutter,
        };
        return true;
      }
      return false;
    });
