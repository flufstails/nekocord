import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.embeds) || msg.embeds.length === 0) return false;
  let changed = false;
  for (let i = 0; i < msg.embeds.length; i += 1) {
    if (msg.embeds[i]?.footer) {
      msg.embeds[i].footer = undefined;
      changed = true;
    }
  }
  return changed;
});
