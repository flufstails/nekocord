import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
      transformOutsideCode(c, (s) => s.replace(/\/unflip\b/gi, '\u252C\u2500\u252C\u30CE( \u00BA _ \u00BA\u30CE)')));
