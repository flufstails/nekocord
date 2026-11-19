import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      if (
        msg.tagText &&
        Array.isArray(msg.attachments) &&
        msg.attachments.length > 0 &&
        msg.attachmentsOpacity !== 0.72
      ) {
        msg.attachmentsOpacity = 0.72;
        return true;
      }
      return false;
    });
