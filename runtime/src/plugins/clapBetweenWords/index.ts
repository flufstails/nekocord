import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        s.replace(/([A-Za-z0-9']+)\s+(?=[A-Za-z0-9'])/g, '$1 \uD83D\uDC4F '),
      ));
