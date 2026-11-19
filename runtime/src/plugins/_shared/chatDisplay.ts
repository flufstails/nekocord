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

/**
 * Checks whether a chat message's content string or AST node array contains {@code needle}.
 */
export function messageContainsText(msg: Record<string, any>, needle: string): boolean {
  if (!needle) return false;
  if (typeof msg.content === 'string') {
    return msg.content.includes(needle);
  }
  if (!Array.isArray(msg.content)) {
    return false;
  }
  const stack = [...msg.content];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;
    if (typeof node === 'string') {
      if (node.includes(needle)) return true;
    } else if (typeof node === 'object') {
      if (typeof node.content === 'string' && node.content.includes(needle)) {
        return true;
      }
      if (Array.isArray(node.content)) {
        for (let i = 0; i < node.content.length; i += 1) {
          stack.push(node.content[i]);
        }
      }
    }
  }
  return false;
}

/**
 * Appends a text note to either a string or Discord AST {@code msg.content} array.
 */
export function appendMessageText(msg: Record<string, any>, note: string): boolean {
  if (!note || messageContainsText(msg, note)) {
    return false;
  }
  if (Array.isArray(msg.content)) {
    const prefix = msg.content.length > 0 ? ' ' : '';
    msg.content.push({ type: 'text', content: `${prefix}${note}` });
    return true;
  }
  const base = typeof msg.content === 'string' ? msg.content.trimEnd() : '';
  msg.content = base ? `${base} ${note}` : note;
  return true;
}

/**
 * Appends a concise tag to {@code msg.timestamp} when not already present.
 */
export function appendTimestampNote(msg: Record<string, any>, suffix: string): boolean {
  if (!suffix) return false;
  const cur = typeof msg.timestamp === 'string' ? msg.timestamp : '';
  if (cur.includes(suffix)) return false;
  msg.timestamp = cur ? `${cur} ${suffix}` : suffix;
  return true;
}

/**
 * Converts HSL (h: 0..360, s: 0..100, l: 0..100) into Android signed ARGB int.
 */
export function hslToAndroidArgb(h: number, s: number, l: number): number {
  const sn = Math.max(0, Math.min(100, s)) / 100;
  const ln = Math.max(0, Math.min(100, l)) / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const val = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(val * 255);
  };
  return toAndroidColor(255, channel(0), channel(8), channel(4));
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
