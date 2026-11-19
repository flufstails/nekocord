import { appendMessageText, createRowPlugin, messageContainsText } from '../_shared/chatDisplay.js';

function isVoiceMessage(msg: Record<string, any>): boolean {
  const isVoiceFlag = (Number(msg.flags) & 8192) !== 0;
  if (isVoiceFlag) return true;
  if (!Array.isArray(msg.attachments)) return false;
  return msg.attachments.some(
    (att: any) => att && typeof att === 'object' && (Boolean(att.waveform) || Number(att.duration_secs) > 0),
  );
}

export default createRowPlugin((_row, msg) => {
  if (!isVoiceMessage(msg) || !Array.isArray(msg.attachments) || msg.attachments.length === 0) {
    return false;
  }
  const att = msg.attachments.find(
    (a: any) =>
      a &&
      typeof a === 'object' &&
      (Boolean(a.waveform) || Number(a.duration_secs) > 0 || /\.ogg(?:\?|$)/i.test(String(a.filename || ''))),
  ) ?? msg.attachments[0];
  const url = typeof att?.url === 'string' && att.url ? att.url : typeof att?.proxy_url === 'string' ? att.proxy_url : '';
  if (!url) {
    return false;
  }
  const note = `Audio: ${url}`;
  if (messageContainsText(msg, note)) {
    return false;
  }
  return appendMessageText(msg, note);
});
