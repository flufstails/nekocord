import { transformOutsideCode } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCode(c, (s) => (s.trim() && !s.trim().startsWith('**') ? `**${s.trim()}**` : s)));
