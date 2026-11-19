import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      if (Array.isArray(msg.reactions) && msg.reactions.length > 6) {
        msg.reactions = msg.reactions.slice(0, 6);
        return true;
      }
      return false;
    });
