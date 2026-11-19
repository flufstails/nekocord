import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) => s.replace(/\s--\s/g, ' \u2014 ').replace(/\.{3}/g, '\u2026')));
