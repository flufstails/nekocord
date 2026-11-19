import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        s
          .replace(/\bhello\b/gi, 'ahoy')
          .replace(/\bfriend\b/gi, 'matey')
          .replace(/\bmy\b/gi, "me")
          .replace(/\byour\b/gi, 'yer')
          .replace(/\byes\b/gi, 'aye'),
      ));
