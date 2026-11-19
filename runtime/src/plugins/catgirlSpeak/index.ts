import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) => {
        const trimmed = s.trim();
        if (!trimmed) return s;
        const swapped = s.replace(/\bna/gi, 'nya').replace(/\bno\b/gi, 'nyo');
        return /nya|mrrp|~$/i.test(swapped) ? swapped : `${swapped.replace(/\s+$/, '')} nya~`;
      }));
