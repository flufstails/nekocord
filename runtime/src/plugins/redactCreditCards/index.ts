import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  transformOutsideCode(c, (s) =>
    s.replace(/\b(?:\d{4}[- ]?){3}\d{4}\b/g, '[redacted-card]'),
  ),
);
