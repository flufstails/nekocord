import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin, LEET_MAP, mapChars } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) => mapChars(s, (ch) => LEET_MAP[ch] ?? ch)));
