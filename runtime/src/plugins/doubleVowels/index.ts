import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        s.replace(/\b([A-Za-z]*?)([aeiouAEIOU])([bcdfghjklmnpqrstvwxyz]?)\b/g, '$1$2$2$3'),
      ));
