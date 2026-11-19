import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) => s.replace(/(^|\s)(:[a-zA-Z0-9_+-]{2,32}:)/g, '$1\\$2')));
