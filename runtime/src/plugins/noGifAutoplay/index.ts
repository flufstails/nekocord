import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      if (msg.gifAutoPlay !== false) {
        msg.gifAutoPlay = false;
        return true;
      }
      return false;
    });
