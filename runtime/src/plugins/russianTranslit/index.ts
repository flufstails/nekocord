import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin, CYRILLIC_MAP, mapChars } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) => mapChars(s, (ch) => CYRILLIC_MAP[ch] ?? ch)));
