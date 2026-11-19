import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => transformOutsideCode(c, (s) => s.replace(/\/shrug\b/gi, '\u00AF\\_(\u30C4)_/\u00AF')));
