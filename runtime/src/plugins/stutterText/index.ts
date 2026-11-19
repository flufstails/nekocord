import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        s.replace(/^(\s*)([bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ])([a-zA-Z]{2,})/, '$1$2-$2$3'),
      ));
