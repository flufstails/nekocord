import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.embeds) || msg.embeds.length === 0) return false;
  let changed = false;
  for (let i = 0; i < msg.embeds.length; i += 1) {
    const emb = msg.embeds[i];
    if (emb && Array.isArray(emb.fields) && emb.fields.length > 0) {
      emb.fields = [];
      changed = true;
    }
  }
  return changed;
});
