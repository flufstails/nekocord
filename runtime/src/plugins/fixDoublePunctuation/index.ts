import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  transformOutsideCodeAndTokens(c, (plain) => plain.replace(/\s+([,.!?;:])(?=\s|$)/g, '$1')),
);
