import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  transformOutsideCode(c, (s) => s.replace(/^(\s*)[-*]\s+/gm, '$1\u2022 ')),
);
