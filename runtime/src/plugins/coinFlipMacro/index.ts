import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
      transformOutsideCode(c, (s) =>
        s.replace(/\/coin\b/gi, () => (Math.random() < 0.5 ? '**Heads**' : '**Tails**')),
      ));
