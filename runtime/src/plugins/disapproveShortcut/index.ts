import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => transformOutsideCode(c, (s) => s.replace(/\/lod\b/gi, '\u0CA0_\u0CA0')));
