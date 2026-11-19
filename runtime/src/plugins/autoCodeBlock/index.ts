import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => {
      const t = c.trim();
      if (t.includes('```') || !t.includes('\n')) return c;
      if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
        return `\`\`\`json\n${t}\n\`\`\``;
      }
      if (/^\s*at\s+\S+/m.test(t) || /^(Error|TypeError|ReferenceError):/m.test(t)) {
        return `\`\`\`\n${t}\n\`\`\``;
      }
      return c;
    });
