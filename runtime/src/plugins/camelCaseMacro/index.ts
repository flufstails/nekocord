import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  c.replace(/\\camel:([^\n]+)/gi, (_m, txt) => {
    const words = String(txt).trim().toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    return words.map((w, idx) => (idx === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1))).join('');
  }),
);
