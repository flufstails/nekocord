import { patchOutgoingMessageContent } from '../../utils/text.js';
import { definePlugin, type PluginImplementation } from '../types.js';

export const MORSE_TABLE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....',
  6: '-....', 7: '--...', 8: '---..', 9: '----.',
};

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function utf8ToBytes(str: string): number[] {
  const encoded = encodeURIComponent(str);
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i += 1) {
    if (encoded[i] === '%') {
      bytes.push(parseInt(encoded.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(encoded.charCodeAt(i));
    }
  }
  return bytes;
}

export function encodeBase64(str: string): string {
  const bytes = utf8ToBytes(str);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const hasB = i + 1 < bytes.length;
    const hasC = i + 2 < bytes.length;
    const b = hasB ? bytes[i + 1] : 0;
    const c = hasC ? bytes[i + 2] : 0;
    const triple = (a << 16) | (b << 8) | c;
    out += B64_CHARS[(triple >> 18) & 63];
    out += B64_CHARS[(triple >> 12) & 63];
    out += hasB ? B64_CHARS[(triple >> 6) & 63] : '=';
    out += hasC ? B64_CHARS[triple & 63] : '=';
  }
  return out;
}

export function decodeBase64(b64: string): string | null {
  const clean = b64.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean) || clean.length % 4 !== 0) {
    return null;
  }
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c1 = B64_CHARS.indexOf(clean[i]);
    const c2 = B64_CHARS.indexOf(clean[i + 1]);
    const c3 = clean[i + 2] === '=' ? -1 : B64_CHARS.indexOf(clean[i + 2]);
    const c4 = clean[i + 3] === '=' ? -1 : B64_CHARS.indexOf(clean[i + 3]);
    if (c1 < 0 || c2 < 0) return null;
    bytes.push((c1 << 2) | (c2 >> 4));
    if (c3 >= 0) bytes.push(((c2 & 15) << 4) | (c3 >> 2));
    if (c4 >= 0) bytes.push(((c3 & 3) << 6) | c4);
  }
  try {
    const pct = bytes.map((b) => `%${b.toString(16).padStart(2, '0')}`).join('');
    return decodeURIComponent(pct);
  } catch {
    return null;
  }
}

/**
 * Pure-JS recursive-descent math expression evaluator (+ - * / % ^ and parentheses).
 */
export function safeEvaluateMath(expr: string): number | null {
  let pos = 0;
  const src = expr.replace(/\s+/g, '');
  if (!src || !/^[0-9+\-*/%^().]+$/.test(src)) {
    return null;
  }

  function parsePrimary(): number {
    if (src[pos] === '+' || src[pos] === '-') {
      const sign = src[pos] === '-' ? -1 : 1;
      pos += 1;
      return sign * parsePrimary();
    }
    if (src[pos] === '(') {
      pos += 1;
      const val = parseExpression();
      if (src[pos] !== ')') throw new Error('Unmatched (');
      pos += 1;
      return val;
    }
    const start = pos;
    while (pos < src.length && /[0-9.]/.test(src[pos])) {
      pos += 1;
    }
    if (pos === start) throw new Error('Expected number');
    const num = Number(src.slice(start, pos));
    if (!Number.isFinite(num)) throw new Error('Invalid number');
    return num;
  }

  function parsePower(): number {
    const left = parsePrimary();
    if (src[pos] === '^') {
      pos += 1;
      return Math.pow(left, parsePower());
    }
    return left;
  }

  function parseTerm(): number {
    let val = parsePower();
    while (pos < src.length && (src[pos] === '*' || src[pos] === '/' || src[pos] === '%')) {
      const op = src[pos];
      pos += 1;
      const right = parsePower();
      if (op === '*') val *= right;
      else if (op === '/') {
        if (right === 0) throw new Error('Zero division');
        val /= right;
      } else {
        if (right === 0) throw new Error('Zero modulo');
        val %= right;
      }
    }
    return val;
  }

  function parseExpression(): number {
    let val = parseTerm();
    while (pos < src.length && (src[pos] === '+' || src[pos] === '-')) {
      const op = src[pos];
      pos += 1;
      const right = parseTerm();
      val = op === '+' ? val + right : val - right;
    }
    return val;
  }

  try {
    const result = parseExpression();
    if (pos !== src.length || !Number.isFinite(result)) {
      return null;
    }
    return Math.round(result * 1e9) / 1e9;
  } catch {
    return null;
  }
}

export function createUtilityPlugin(
  transform: (content: string) => string,
): PluginImplementation {
  let unpatch: (() => void) | null = null;

  return definePlugin({
    start() {
      if (unpatch) {
        return;
      }
      unpatch = patchOutgoingMessageContent((content) => {
        if (!content) {
          return content;
        }
        return transform(content);
      });
    },

    stop() {
      if (unpatch) {
        unpatch();
        unpatch = null;
      }
    },
  });
}
