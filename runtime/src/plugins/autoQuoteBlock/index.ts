import { transformOutsideCode } from '../../utils/text.js';
import { createTextStylePlugin, prefixLines } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) => transformOutsideCode(c, (s) => prefixLines(s, '> ')));
