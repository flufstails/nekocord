import { appendMessageText, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.content) || msg.content.length !== 1) {
    return false;
  }
  const node = msg.content[0];
  if (!node || node.type !== 'customEmoji' || !node.id) {
    return false;
  }
  const cleanName = String(node.alt ?? node.name ?? 'emoji').replace(/^:|:$/g, '');
  const prefix = node.animated ? '<a:' : '<:';
  const rawTag = `${prefix}${cleanName}:${node.id}>`;
  return appendMessageText(msg, `\`${rawTag}\``);
});
