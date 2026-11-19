import { createRowPlugin } from '../_shared/chatDisplay.js';

function stripEmojiNodes(nodes: any[]): { next: any[]; mutated: boolean } {
  const next: any[] = [];
  let mutated = false;
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!node || typeof node !== 'object') {
      next.push(node);
      continue;
    }
    if (node.type === 'customEmoji' || (node.type === 'emoji' && node.id)) {
      const label = node.alt ?? node.name ?? node.content ?? 'emoji';
      next.push({ type: 'text', content: `:${String(label).replace(/^:|:$/g, '')}:` });
      mutated = true;
      continue;
    }
    if (Array.isArray(node.content)) {
      const inner = stripEmojiNodes(node.content);
      if (inner.mutated) {
        next.push({ ...node, content: inner.next });
        mutated = true;
      } else {
        next.push(node);
      }
      continue;
    }
    next.push(node);
  }
  return { next, mutated };
}

export default createRowPlugin((_row, msg) => {
  if (Array.isArray(msg.content)) {
    const res = stripEmojiNodes(msg.content);
    if (res.mutated) {
      msg.content = res.next;
      return true;
    }
    return false;
  }
  if (typeof msg.content === 'string') {
    const replaced = msg.content.replace(/<a?:([a-zA-Z0-9_~]+):\d+>/g, ':$1:');
    if (replaced !== msg.content) {
      msg.content = replaced;
      return true;
    }
  }
  return false;
});
