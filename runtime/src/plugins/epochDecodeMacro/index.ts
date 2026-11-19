import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  c.replace(/\\epoch:(\d{10,13})\b/g, (full, digits) => {
    const n = Number(digits);
    const ms = digits.length <= 10 ? n * 1000 : n;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? full : d.toISOString();
  }),
);
