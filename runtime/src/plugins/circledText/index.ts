import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin, mapAlphaRange } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) => mapAlphaRange(s, 0x24b6, 0x24d0)));
