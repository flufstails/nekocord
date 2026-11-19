import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        s.replace(/\b([A-Za-z]{3,})\b/g, (_, w: string) => w.split('').join(' ')),
      ));
