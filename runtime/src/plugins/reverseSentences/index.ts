import { transformOutsideCode } from '../../utils/text.js';
import { createTextStylePlugin } from '../_shared/textStyle.js';

export default createTextStylePlugin((c) =>
      transformOutsideCode(c, (s) => {
        const sentences = s.match(/[^.!?]+[.!?]*/g);
        if (!sentences || sentences.length < 2) return s;
        return sentences.map((x) => x.trim()).reverse().join(' ');
      }));
