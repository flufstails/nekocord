import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => {
      const m = /^\/urlencode\s+([\s\S]+)$/i.exec(c);
      return m ? encodeURIComponent(m[1]) : c;
    });
