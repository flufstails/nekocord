import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin, mapChars } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        mapChars(s, (ch) => {
          const code = ch.charCodeAt(0);
          if (code === 32) return '\u3000';
          if (code >= 33 && code <= 126) return String.fromCharCode(code + 0xfee0);
          return ch;
        }),
      ));
