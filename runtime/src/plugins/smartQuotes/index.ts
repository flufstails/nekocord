import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        s
          .replace(/(^|[\s(\[])"/g, '$1\u201C')
          .replace(/"/g, '\u201D')
          .replace(/(\w)'(\w)/g, '$1\u2019$2'),
      ));
