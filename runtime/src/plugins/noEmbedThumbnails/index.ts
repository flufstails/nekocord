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
        if (emb.thumbnail != null) {
          emb.thumbnail = undefined;
          changed = true;
        }
        if (emb.image != null) {
          emb.image = undefined;
          changed = true;
        }
        if (emb.video != null) {
          emb.video = undefined;
          changed = true;
        }
      }
      return changed;
    });
