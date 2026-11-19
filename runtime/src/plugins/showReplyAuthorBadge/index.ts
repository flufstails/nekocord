import { appendTimestampNote, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  const targetUser = msg.referencedMessage?.author?.username;
  if (typeof targetUser !== 'string' || !targetUser) return false;
  return appendTimestampNote(msg, `[-> @${targetUser}]`);
});
