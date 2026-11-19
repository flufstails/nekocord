import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      if (!Array.isArray(msg.embeds) || msg.embeds.length === 0) {
        return false;
      }
      let changed = false;
      for (let i = 0; i < msg.embeds.length; i += 1) {
        const emb = msg.embeds[i];
        if (!emb || typeof emb !== 'object') {
          continue;
        }
        if (emb.author != null) {
          emb.author = undefined;
          changed = true;
        }
        if (emb.footer != null) {
          emb.footer = undefined;
          changed = true;
        }
      }
      return changed;
    });
