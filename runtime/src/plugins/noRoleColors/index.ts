import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      let changed = false;
      if (msg.roleColor != null) {
        msg.roleColor = undefined;
        changed = true;
      }
      if (msg.roleColors != null) {
        msg.roleColors = undefined;
        changed = true;
      }
      return changed;
    });
