import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  transformOutsideCode(c, (s) =>
    s.replace(/(^|[^|<>])(https?:\/\/[^\s|<>]+)/g, '$1||$2||'),
  ),
);
