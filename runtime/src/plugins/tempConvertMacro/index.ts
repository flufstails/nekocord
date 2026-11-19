import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  transformOutsideCode(c, (s) =>
    s.replace(/\\(-?\d+(?:\.\d+)?)([CF])\b/gi, (_m, valRaw, unitRaw) => {
      const val = Number(valRaw);
      if (unitRaw.toUpperCase() === 'C') {
        const f = Math.round((val * 9) / 5 + 32);
        return `${valRaw}\u00B0C (${f}\u00B0F)`;
      }
      const cVal = Math.round(((val - 32) * 5) / 9);
      return `${valRaw}\u00B0F (${cVal}\u00B0C)`;
    }),
  ),
);
