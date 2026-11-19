import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
      transformOutsideCode(c, (s) => s.replace(/\/tableflip\b/gi, '(\u256F\u00B0\u25A1\u00B0)\u256F\uFE35 \u253B\u2501\u253B')));
