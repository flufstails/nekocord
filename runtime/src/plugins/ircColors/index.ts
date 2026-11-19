import { createRowPlugin, hslToAndroidArgb } from '../_shared/chatDisplay.js';
import { definePluginSettings, OptionType } from '../settings.js';

const settings = definePluginSettings({
  lightness: {
    type: OptionType.SELECT,
    label: 'Color Lightness',
    description: 'Brightness level used when generating deterministic username colors.',
    default: 74,
    options: [
      { label: 'Medium (64%)', value: 64 },
      { label: 'Balanced (74%)', value: 74 },
      { label: 'Pastel Bright (82%)', value: 82 },
    ],
  },
  saturation: {
    type: OptionType.SELECT,
    label: 'Color Saturation',
    description: 'Color vibrancy intensity for generated username shades.',
    default: 72,
    options: [
      { label: 'Soft (60%)', value: 60 },
      { label: 'Standard (72%)', value: 72 },
      { label: 'Vivid (84%)', value: 84 },
    ],
  },
});

function hashToHue(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 360;
}

const impl = createRowPlugin((_row, msg) => {
  if (typeof msg.usernameColor === 'number' && msg.usernameColor !== 0) {
    return false;
  }
  const seed = String(msg.authorId || msg.username || '');
  if (!seed) {
    return false;
  }
  msg.usernameColor = hslToAndroidArgb(
    hashToHue(seed),
    settings.store.saturation,
    settings.store.lightness,
  );
  return true;
});

export default { ...impl, settings };
