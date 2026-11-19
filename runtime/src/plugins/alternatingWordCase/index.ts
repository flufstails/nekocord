import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) => {
        let index = 0;
        return s.replace(/\b([A-Za-z]+)\b/g, (word) => {
          const next = index % 2 === 0 ? word.toUpperCase() : word.toLowerCase();
          index += 1;
          return next;
        });
      }));
