import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      let changed = false;
      if (msg.tagText != null) {
        msg.tagText = undefined;
        changed = true;
      }
      if (msg.tagVerified) {
        msg.tagVerified = false;
        changed = true;
      }
      return changed;
    });
