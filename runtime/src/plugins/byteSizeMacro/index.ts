import { createUtilityPlugin, utf8ToBytes } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  c.replace(/\\bytes:([^\n]+)/gi, (_m, txt) => {
    const clean = String(txt).trim();
    return `${clean} (${utf8ToBytes(clean).length} bytes)`;
  }),
);
