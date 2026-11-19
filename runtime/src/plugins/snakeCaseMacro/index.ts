import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  c.replace(/\\snake:([^\n]+)/gi, (_m, txt) =>
    String(txt).trim().toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).join('_'),
  ),
);
