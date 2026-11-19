import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      if (!Array.isArray(msg.reactions) || msg.reactions.length === 0) {
        return false;
      }
      const next = msg.reactions.filter((r: any) => Boolean(r?.me || r?.me_burst));
      if (next.length !== msg.reactions.length) {
        msg.reactions = next;
        return true;
      }
      return false;
    });
