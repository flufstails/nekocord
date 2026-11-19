import { createUtilityPlugin, safeEvaluateMath } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => {
      const m = /^\/calc\s+(.+)$/i.exec(c.trim());
      if (!m) return c;
      const val = safeEvaluateMath(m[1]);
      return val != null ? `${m[1].trim()} = **${val}**` : c;
    });
