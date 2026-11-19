import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => (c.length > 20 ? `${c} \`[${c.length} chars]\`` : c));
