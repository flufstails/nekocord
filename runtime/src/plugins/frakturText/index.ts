import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin, FRAKTUR_UPPER } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) => {
        let out = '';
        for (let i = 0; i < s.length; i += 1) {
          const code = s.charCodeAt(i);
          if (code >= 65 && code <= 90) {
            out += FRAKTUR_UPPER[code - 65];
          } else if (code >= 97 && code <= 122) {
            out += String.fromCodePoint(0x1d51e + (code - 97));
          } else {
            out += s[i];
          }
        }
        return out;
      }));
