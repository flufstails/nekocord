import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  c.replace(/\\udec:(\S+)/gi, (full, encoded) => {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return full;
    }
  }),
);
