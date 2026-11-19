import { registerMessageRowTransformer, toAndroidColor } from '../../chat/rows.js';
import { definePlugin, type PluginImplementation } from '../types.js';

export const ROW_COLOURS = {
  amberBg: toAndroidColor(36, 250, 166, 26),
  amberGutter: toAndroidColor(255, 250, 166, 26),
  blurpleBg: toAndroidColor(28, 88, 101, 242),
  blurpleGutter: toAndroidColor(255, 88, 101, 242),
  mintBg: toAndroidColor(28, 35, 165, 90),
  mintGutter: toAndroidColor(255, 35, 165, 90),
  cyanBg: toAndroidColor(26, 0, 168, 252),
  cyanGutter: toAndroidColor(255, 0, 168, 252),
  purpleBg: toAndroidColor(32, 184, 118, 247),
  purpleGutter: toAndroidColor(255, 184, 118, 247),
};

const DISCORD_EPOCH_MS = 1420070400000;
const DIVISOR_4194304 = 4194304;
export const CONTROL_RE = /[\u200B-\u200D\uFEFF\u202A-\u202E]/g;

/**
 * Extracts UTC timestamp ms from a numeric Discord snowflake without BigInt.
 */
export function snowflakeToEpochMs(id: unknown): number | null {
  if (typeof id !== 'string' || !/^\d{15,22}$/.test(id)) {
    return null;
  }
  let quotient = 0;
  let remainder = 0;
  for (let i = 0; i < id.length; i += 1) {
    const digit = id.charCodeAt(i) - 48;
    remainder = remainder * 10 + digit;
    const q = Math.floor(remainder / DIVISOR_4194304);
    quotient = quotient * 10 + q;
    remainder -= q * DIVISOR_4194304;
  }
  return quotient > 0 ? quotient + DISCORD_EPOCH_MS : null;
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function clearProp(obj: Record<string, any>, key: string): boolean {
  if (obj[key] !== undefined && obj[key] !== null) {
    obj[key] = undefined;
    return true;
  }
  return false;
}

export function clearArrayProp(obj: Record<string, any>, key: string): boolean {
  if (Array.isArray(obj[key]) && obj[key].length > 0) {
    obj[key] = [];
    return true;
  }
  return false;
}

export function createRowPlugin(
  transform: (row: Record<string, any>, msg: Record<string, any>) => boolean,
): PluginImplementation {
  let unregister: (() => void) | null = null;

  return definePlugin({
    start() {
      if (unregister) {
        return;
      }
      unregister = registerMessageRowTransformer((row) => {
        const msg = row?.message;
        if (!msg || typeof msg !== 'object') {
          return false;
        }
        return transform(row, msg);
      });
    },

    stop() {
      if (unregister) {
        unregister();
        unregister = null;
      }
    },
  });
}
