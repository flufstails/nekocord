import { appendMessageText, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.attachments) || msg.attachments.length === 0) {
    return false;
  }
  const hasSuspicious = msg.attachments.some(
    (att: any) => Boolean(att?.isSuspiciousDownload || att?.verifyAge),
  );
  if (!hasSuspicious) {
    return false;
  }
  return appendMessageText(msg, '[Suspicious Attachment]');
});
