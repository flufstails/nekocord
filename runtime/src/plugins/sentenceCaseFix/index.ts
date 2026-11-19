import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        s.replace(/(^|[.!?]\s+)([a-z])/g, (_, lead: string, ch: string) => `${lead}${ch.toUpperCase()}`),
      ));
