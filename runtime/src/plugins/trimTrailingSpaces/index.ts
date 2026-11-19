import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) => c.trim().replace(/\n{3,}/g, '\n\n'));
