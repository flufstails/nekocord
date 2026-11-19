import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => {
  const trimmed = c.trim();
  if (trimmed.indexOf('\\json:') !== 0) return c;
  const raw = trimmed.slice(6).trim();
  try {
    const parsed = JSON.parse(raw);
    return `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
  } catch {
    return c;
  }
});
