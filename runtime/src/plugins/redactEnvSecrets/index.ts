import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  transformOutsideCode(c, (s) =>
    s.replace(/\b([A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY|DATABASE_URL))\s*=\s*[^\s\n]+/g, '$1=[redacted]'),
  ),
);
