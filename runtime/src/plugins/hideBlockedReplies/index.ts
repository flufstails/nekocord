import { clearProp, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  const ref = msg.referencedMessage;
  if (!ref || typeof ref !== 'object') return false;
  if (ref.state === 1 || ref.blocked === true) {
    return clearProp(msg, 'referencedMessage');
  }
  return false;
});
