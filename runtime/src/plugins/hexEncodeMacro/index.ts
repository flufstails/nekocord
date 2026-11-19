import { createUtilityPlugin, utf8ToBytes } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => {
      const m = /^\/hex\s+([\s\S]+)$/i.exec(c);
      if (!m) return c;
      return utf8ToBytes(m[1])
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ');
    });
