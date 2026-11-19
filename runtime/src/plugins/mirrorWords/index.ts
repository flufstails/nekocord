import { transformOutsideCode } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCode(c, (s) => {
        const parts = s.trim().split(/\s+/);
        return parts.length > 1 ? parts.reverse().join(' ') : s;
      }));
