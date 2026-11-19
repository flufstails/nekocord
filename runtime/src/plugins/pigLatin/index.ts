import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        s.replace(/\b([a-zA-Z]{2,})\b/g, (word) => {
          const lower = word.toLowerCase();
          if (/^[aeiou]/.test(lower)) return `${word}way`;
          const match = /^([^aeiouAEIOU]+)(.+)$/.exec(word);
          return match ? `${match[2]}${match[1].toLowerCase()}ay` : word;
        }),
      ));
