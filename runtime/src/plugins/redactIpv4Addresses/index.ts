import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
      transformOutsideCode(c, (s) =>
        s.replace(/\b(?!127\.0\.0\.1\b|10\.\d+\.\d+\.\d+\b|192\.168\.\d+\.\d+\b)(?:25[0-5]|2[0-4]\d|[01]?\d\d?)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}\b/g, '[redacted-ip]'),
      ));
