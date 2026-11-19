import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) => (c.startsWith('||') && c.endsWith('||') ? c : `||${c}||`));
