import { createUtilityPlugin } from '../_shared/chatUtility.js';

function dedentBlock(block: string): string {
  const lines = block.split('\n');
  if (lines.length < 3) return block;
  let minIndent = Infinity;
  for (let i = 1; i < lines.length - 1; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    const match = /^[ \t]+/.exec(line);
    const len = match ? match[0].length : 0;
    if (len < minIndent) minIndent = len;
    if (minIndent === 0) break;
  }
  if (!Number.isFinite(minIndent) || minIndent <= 0) return block;
  for (let i = 1; i < lines.length - 1; i += 1) {
    if (lines[i].trim()) {
      lines[i] = lines[i].slice(minIndent);
    }
  }
  return lines.join('\n');
}

export default createUtilityPlugin((content) => {
  if (!content.includes('```')) return content;
  return content.replace(/```[^\n]*\n[\s\S]*?\n```/g, dedentBlock);
});
