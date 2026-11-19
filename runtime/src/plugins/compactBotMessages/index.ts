import { createRowPlugin } from '../_shared/chatDisplay.js';

function collapseAstNodes(nodes: any[]): boolean {
  let mutated = false;
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'text' && typeof node.content === 'string') {
      const collapsed = node.content.replace(/\n{3,}/g, '\n\n');
      if (collapsed !== node.content) {
        node.content = collapsed;
        mutated = true;
      }
    } else if (Array.isArray(node.content) && collapseAstNodes(node.content)) {
      mutated = true;
    }
  }
  return mutated;
}

export default createRowPlugin((_row, msg) => {
  if (!msg.tagText) return false;
  if (typeof msg.content === 'string') {
    const collapsed = msg.content.replace(/\n{3,}/g, '\n\n');
    if (collapsed !== msg.content) {
      msg.content = collapsed;
      return true;
    }
    return false;
  }
  if (Array.isArray(msg.content)) {
    return collapseAstNodes(msg.content);
  }
  return false;
});
