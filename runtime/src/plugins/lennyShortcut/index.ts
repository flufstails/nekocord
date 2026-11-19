import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => transformOutsideCode(c, (s) => s.replace(/\/lenny\b/gi, '( \u0361\u00B0 \u035C\u0296 \u0361\u00B0)')));
