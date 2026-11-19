import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      if (msg.useAttachmentUploadPreview) {
        msg.useAttachmentUploadPreview = false;
        return true;
      }
      return false;
    });
