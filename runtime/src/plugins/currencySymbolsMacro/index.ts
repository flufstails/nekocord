import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

const CURRENCY: Record<string, string> = {
  eur: '\u20AC',
  gbp: '\u00A3',
  jpy: '\u00A5',
  krw: '\u20A9',
  btc: '\u20BF',
};

export default createUtilityPlugin((c) =>
  transformOutsideCode(c, (s) =>
    s.replace(/\\(eur|gbp|jpy|krw|btc)\b/gi, (full, k) => CURRENCY[k.toLowerCase()] ?? full),
  ),
);
