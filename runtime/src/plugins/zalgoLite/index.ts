import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin, mapChars } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        mapChars(s, (ch) => (/[A-Za-z]/.test(ch) ? `${ch}\u030D\u0329` : ch)),
      ));
