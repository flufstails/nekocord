import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      if (msg.edited && msg.edited !== 'deleted') {
        msg.edited = undefined;
        return true;
      }
      return false;
    });
