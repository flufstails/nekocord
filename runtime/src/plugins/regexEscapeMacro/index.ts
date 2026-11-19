import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  c.replace(/\\re:([^\n]+)/gi, (_m, txt) =>
    String(txt).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  ),
);
