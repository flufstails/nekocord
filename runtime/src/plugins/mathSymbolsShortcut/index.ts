import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  transformOutsideCode(c, (s) =>
    s
      .replace(/!=/g, '\u2260')
      .replace(/<=/g, '\u2264')
      .replace(/>=/g, '\u2265')
      .replace(/\+-/g, '\u00B1')
      .replace(/~=/g, '\u2248'),
  ),
);
