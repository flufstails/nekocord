import { appendTimestampNote, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  const ref = msg.referencedMessage;
  if (!ref || typeof ref !== 'object') return false;
  if (ref.state === 'deleted' || ref.state === 'missing' || (!ref.message && ref.messageId)) {
    return appendTimestampNote(msg, '[reply unavailable]');
  }
  return false;
});
