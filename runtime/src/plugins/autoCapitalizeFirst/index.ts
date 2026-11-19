import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => {
  const trimmed = c.trimStart();
  if (!trimmed || trimmed[0] === '/' || trimmed[0] === '`' || /^https?:\/\//i.test(trimmed) || /^:[a-zA-Z0-9_]+:/.test(trimmed)) {
    return c;
  }
  return c.replace(/^(\s*)([a-z])/, (_m, lead, ch) => lead + ch.toUpperCase());
});
