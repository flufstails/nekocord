import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!msg.poll || typeof msg.poll !== 'object' || !msg.poll.results) return false;
  msg.poll.results = undefined;
  return true;
});
