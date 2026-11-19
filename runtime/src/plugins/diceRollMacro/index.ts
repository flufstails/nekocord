import { transformOutsideCode } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
      transformOutsideCode(c, (s) =>
        s.replace(/\/roll(?:\s+(\d{1,2})d(\d{1,4}))?\b/gi, (_, nRaw?: string, sRaw?: string) => {
          const count = Math.min(20, Math.max(1, nRaw ? parseInt(nRaw, 10) : 1));
          const sides = Math.min(1000, Math.max(2, sRaw ? parseInt(sRaw, 10) : 6));
          const rolls: number[] = [];
          let sum = 0;
          for (let i = 0; i < count; i += 1) {
            const roll = 1 + Math.floor(Math.random() * sides);
            rolls.push(roll);
            sum += roll;
          }
          return count === 1
            ? `Rolled d${sides}: **${sum}**`
            : `Rolled ${count}d${sides}: [${rolls.join(', ')}] = **${sum}**`;
        }),
      ));
