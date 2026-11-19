import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => c.replace(/^(?:\s*\n)+|(?:\n\s*)+$/g, ''));
