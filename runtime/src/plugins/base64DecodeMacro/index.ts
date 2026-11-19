import { createUtilityPlugin, decodeBase64 } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => {
      const m = /^\/unb64\s+([\s\S]+)$/i.exec(c);
      if (!m) return c;
      return decodeBase64(m[1]) ?? c;
    });
