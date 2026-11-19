import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        s.replace(/(^|\s)(:-?[)(DPpOo3/\\|])/g, '$1\\$2'),
      ));
