import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => {
  if (!/\\wc\b/i.test(c)) return c;
  const cleaned = c.replace(/\\wc\b/gi, '').trim();
  const count = cleaned ? cleaned.split(/\s+/).length : 0;
  return cleaned ? `${cleaned} [${count} words]` : '[0 words]';
});
