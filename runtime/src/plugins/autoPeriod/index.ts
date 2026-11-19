import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) => {
        const trimmed = s.replace(/\s+$/, '');
        if (trimmed && /[A-Za-z0-9)]$/.test(trimmed) && trimmed.length >= 12) {
          return `${trimmed}.`;
        }
        return s;
      }));
