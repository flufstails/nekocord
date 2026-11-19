import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCodeAndTokens(c, (s) =>
        s
          .replace(/\byou\b/gi, 'thou')
          .replace(/\byour\b/gi, 'thy')
          .replace(/\bare\b/gi, 'art')
          .replace(/\bhello\b/gi, 'hark'),
      ));
