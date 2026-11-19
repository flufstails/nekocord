import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';

function genPass(): string {
  let out = '';
  for (let i = 0; i < 16; i += 1) {
    out += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return `||${out}||`;
}

export default createUtilityPlugin((c) =>
  transformOutsideCode(c, (s) => s.replace(/\\pass\b/gi, () => genPass())),
);
