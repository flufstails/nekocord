import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin, mapChars } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        mapChars(s, (ch) => {
          const code = ch.charCodeAt(0);
          return code >= 48 && code <= 57 ? String.fromCodePoint(0x1d7f6 + (code - 48)) : ch;
        }),
      ));
