import { createRowPlugin, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
      const hasSticker =
        Boolean(msg.sticker) || (Array.isArray(msg.stickers) && msg.stickers.length > 0);
      if (hasSticker && !row.backgroundHighlight) {
        row.backgroundHighlight = {
          backgroundColor: ROW_COLOURS.purpleBg,
          gutterColor: ROW_COLOURS.purpleGutter,
        };
        return true;
      }
      return false;
    });
