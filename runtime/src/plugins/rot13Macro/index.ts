import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => {
      const m = /^\/rot13\s+([\s\S]+)$/i.exec(c);
      if (!m) return c;
      return m[1].replace(/[A-Za-z]/g, (ch) => {
        const base = ch <= 'Z' ? 65 : 97;
        return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base);
      });
    });
