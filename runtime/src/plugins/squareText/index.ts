import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin, mapChars } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        mapChars(s.toUpperCase(), (ch) => {
          const code = ch.charCodeAt(0);
          return code >= 65 && code <= 90 ? String.fromCodePoint(0x1f130 + (code - 65)) : ch;
        }),
      ));
