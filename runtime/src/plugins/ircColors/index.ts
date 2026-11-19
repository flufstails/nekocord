import { createRowPlugin, hslToAndroidArgb } from '../_shared/chatDisplay.js';

function hashToHue(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 360;
}

export default createRowPlugin((_row, msg) => {
  if (typeof msg.usernameColor === 'number' && msg.usernameColor !== 0) {
    return false;
  }
  const seed = String(msg.authorId || msg.username || '');
  if (!seed) {
    return false;
  }
  msg.usernameColor = hslToAndroidArgb(hashToHue(seed), 72, 74);
  return true;
});
