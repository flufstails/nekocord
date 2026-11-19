import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
      transformOutsideCode(c, (s) => s.replace(/\/today\b/gi, () => new Date().toISOString().slice(0, 10))));
