import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
  let changed = false;
  if (msg.isSpam) {
    msg.isSpam = false;
    changed = true;
  }
  if (msg.shouldHide) {
    msg.shouldHide = false;
    changed = true;
  }
  if (row.collapsed) {
    row.collapsed = false;
    changed = true;
  }
  return changed;
});
