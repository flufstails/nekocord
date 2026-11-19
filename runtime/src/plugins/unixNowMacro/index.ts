import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
      transformOutsideCode(c, (s) => s.replace(/\/unixnow\b/gi, () => `<t:${Math.floor(Date.now() / 1000)}:F>`)));
