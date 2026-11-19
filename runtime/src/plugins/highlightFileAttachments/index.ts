import { appendTimestampNote, createRowPlugin } from '../_shared/chatDisplay.js';

const MEDIA_EXT_RE = /\.(png|jpe?g|gif|webp|mp4|mov|webm)$/i;

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.attachments) || msg.attachments.length === 0) return false;
  const hasDoc = msg.attachments.some((a: any) => {
    const fn = String(a?.filename || a?.url || '');
    return fn && !MEDIA_EXT_RE.test(fn.split('?')[0]);
  });
  return hasDoc ? appendTimestampNote(msg, '[file]') : false;
});
