import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!msg.tagText || typeof msg.content !== 'string') return false;
  const collapsed = msg.content.replace(/\n{3,}/g, '\n\n');
  if (collapsed !== msg.content) {
    msg.content = collapsed;
    return true;
  }
  return false;
});
