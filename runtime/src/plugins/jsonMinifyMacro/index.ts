import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => {
  const trimmed = c.trim();
  if (trimmed.indexOf('\\jmin:') !== 0) return c;
  try {
    return JSON.stringify(JSON.parse(trimmed.slice(6).trim()));
  } catch {
    return c;
  }
});
