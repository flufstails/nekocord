import { transformOutsideCodeAndTokens } from '../../utils/text.js';
import { createUtilityPlugin } from '../_shared/chatUtility.js';

const MAP: Record<string, string> = {
  '1/2': '\u00BD',
  '1/4': '\u00BC',
  '3/4': '\u00BE',
  '1/3': '\u2153',
  '2/3': '\u2154',
};

export default createUtilityPlugin((c) =>
  transformOutsideCodeAndTokens(c, (plain) =>
    plain.replace(/\b(1\/2|1\/4|3\/4|1\/3|2\/3)\b/g, (m) => MAP[m] ?? m),
  ),
);
