import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

const UNIT_SEC: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

export default createUtilityPlugin((c) =>
  transformOutsideCode(c, (s) =>
    s.replace(/\\in(\d+)([smhd])\b/gi, (_m, rawAmt, rawUnit) => {
      const secs = Number(rawAmt) * (UNIT_SEC[rawUnit.toLowerCase()] ?? 60);
      const target = Math.floor(Date.now() / 1000) + secs;
      return `<t:${target}:R>`;
    }),
  ),
);
