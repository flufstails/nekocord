import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  transformOutsideCode(c, (s) =>
    s
      .replace(/<->/g, '\u2194')
      .replace(/->/g, '\u2192')
      .replace(/<-/g, '\u2190')
      .replace(/=>/g, '\u21D2'),
  ),
);
