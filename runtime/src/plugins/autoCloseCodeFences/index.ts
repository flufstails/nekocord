import { createUtilityPlugin } from '../_shared/chatUtility.js';

const FENCE = '\x60\x60\x60';

export default createUtilityPlugin((c) => {
  const matches = c.match(/\x60\x60\x60/g);
  if (!matches || matches.length % 2 === 0) return c;
  return `${c.replace(/\s+$/, '')}\n${FENCE}`;
});
