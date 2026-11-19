import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  transformOutsideCodeAndTokens(c, (plain) =>
    plain.replace(/\b([a-zA-Z0-9]+(?:_[a-zA-Z0-9]+){2,})\b/g, (m) => m.split('_').join('\\_')),
  ),
);
