import { createUtilityPlugin, MORSE_TABLE } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) => {
      const m = /^\/morse\s+([\s\S]+)$/i.exec(c);
      if (!m) return c;
      return m[1]
        .toUpperCase()
        .split('')
        .map((ch) => (ch === ' ' ? '/' : MORSE_TABLE[ch] ?? ch))
        .join(' ');
    });
