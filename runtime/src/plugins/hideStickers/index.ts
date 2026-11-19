import { createRowPlugin, clearProp, clearArrayProp } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      const a = clearProp(msg, 'sticker');
      const b = clearArrayProp(msg, 'stickers');
      return a || b;
    });
