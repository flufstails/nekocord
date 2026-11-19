import { appendMessageText, createRowPlugin } from '../_shared/chatDisplay.js';

function formatBytes(size: unknown): string {
  const n = typeof size === 'number' ? size : 0;
  if (n <= 0) return '';
  if (n >= 1048576) return ` ${(n / 1048576).toFixed(1)}MB`;
  if (n >= 1024) return ` ${Math.round(n / 1024)}KB`;
  return ` ${n}B`;
}

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.attachments) || msg.attachments.length === 0) {
    return false;
  }
  const labels: string[] = [];
  for (let i = 0; i < msg.attachments.length; i += 1) {
    const att = msg.attachments[i];
    const name = typeof att?.filename === 'string' ? att.filename.trim() : '';
    if (name) {
      labels.push(`[${name}${formatBytes(att.size)}]`);
    }
  }
  if (labels.length === 0) return false;
  return appendMessageText(msg, labels.join(' '));
});
