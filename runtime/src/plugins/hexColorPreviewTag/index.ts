import { createUtilityPlugin } from '../_shared/chatUtility.js';

export default createUtilityPlugin((c) =>
  c.replace(/\\hex:#?([0-9a-fA-F]{6})\b/g, (_m, hex) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `#${hex.toUpperCase()} (rgb(${r}, ${g}, ${b}))`;
  }),
);
