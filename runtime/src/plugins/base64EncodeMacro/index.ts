import { createUtilityPlugin, encodeBase64 } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => {
      const m = /^\/b64\s+([\s\S]+)$/i.exec(c);
      return m ? encodeBase64(m[1]) : c;
    });
