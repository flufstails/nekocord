import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin, FLIP_MAP, mapChars } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) => {
        const flipped = mapChars(s, (ch) => FLIP_MAP[ch] ?? ch);
        return flipped.split('').reverse().join('');
      }));
