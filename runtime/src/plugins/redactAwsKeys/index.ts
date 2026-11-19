import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  transformOutsideCode(c, (s) => s.replace(/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, '[redacted-aws-key]')),
);
