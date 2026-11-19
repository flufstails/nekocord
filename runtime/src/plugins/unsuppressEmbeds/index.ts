import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  let changed = false;
  if (msg.suppressEmbeds) {
    msg.suppressEmbeds = false;
    changed = true;
  }
  if (typeof msg.flags === 'number' && (msg.flags & 4) !== 0) {
    msg.flags &= ~4;
    changed = true;
  }
  return changed;
});
