import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  transformOutsideCode(c, (s) => s.replace(/\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/g, 'Bearer [redacted]')),
);
