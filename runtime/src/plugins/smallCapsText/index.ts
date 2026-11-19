import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin, SMALL_CAPS_MAP, mapChars } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        mapChars(s, (ch) => SMALL_CAPS_MAP[ch] ?? ch),
      ));
