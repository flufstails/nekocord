import { patchOutgoingMessageContent } from '../../utils/text.js';
import { definePlugin, type PluginImplementation } from '../types.js';

export const FLIP_MAP: Record<string, string> = {
  a: '\u0250', b: 'q', c: '\u0254', d: 'p', e: '\u01DD', f: '\u025F', g: '\u0183', h: '\u0265',
  i: '\u0131', j: '\u027E', k: '\u029E', l: 'l', m: '\u026F', n: 'u', o: 'o', p: 'd',
  q: 'b', r: '\u0279', s: 's', t: '\u0287', u: 'n', v: '\u028C', w: '\u028D', x: 'x',
  y: '\u028E', z: 'z',
  A: '\u2200', B: 'q', C: '\u0186', D: 'p', E: '\u018E', F: '\u2132', G: '\u05E4', H: 'H',
  I: 'I', J: '\u017F', K: 'K', L: '\u02E5', M: 'W', N: 'N', O: 'O', P: 'd',
  Q: 'Q', R: '\u1D1A', S: 'S', T: '\u22A5', U: '\u2229', V: '\u039B', W: 'M', X: 'X',
  Y: '\u2144', Z: 'Z',
  '?': '\u00BF', '!': '\u00A1', '.': '\u02D9', ',': '\'',
};

export const SMALL_CAPS_MAP: Record<string, string> = {
  a: '\u1D00', b: '\u0299', c: '\u1D04', d: '\u1D05', e: '\u1D07', f: '\uA730', g: '\u0262',
  h: '\u029C', i: '\u026A', j: '\u1D0A', k: '\u1D0B', l: '\u029F', m: '\u1D0D', n: '\u0274',
  o: '\u1D0F', p: '\u1D18', q: 'q', r: '\u0280', s: '\uA731', t: '\u1D1B', u: '\u1D1C',
  v: '\u1D20', w: '\u1D21', x: 'x', y: '\u028F', z: '\u1D22',
};

export const LEET_MAP: Record<string, string> = {
  a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', g: '9', b: '8',
  A: '4', E: '3', I: '1', O: '0', S: '5', T: '7', G: '9', B: '8',
};

export const CYRILLIC_MAP: Record<string, string> = {
  A: '\u0410', a: '\u0430', B: '\u0412', C: '\u0421', c: '\u0441', E: '\u0415', e: '\u0435',
  H: '\u041D', K: '\u041A', k: '\u043A', M: '\u041C', O: '\u041E', o: '\u043E', P: '\u0420',
  p: '\u0440', T: '\u0422', X: '\u0425', x: '\u0445', y: '\u0443',
};

export const FRAKTUR_UPPER = [
  '\uD835\uDD04', '\uD835\uDD05', '\u212D', '\uD835\uDD07', '\uD835\uDD08', '\uD835\uDD09',
  '\uD835\uDD0A', '\u210C', '\u2111', '\uD835\uDD0D', '\uD835\uDD0E', '\uD835\uDD0F',
  '\uD835\uDD10', '\uD835\uDD11', '\uD835\uDD12', '\uD835\uDD13', '\uD835\uDD14', '\u211C',
  '\uD835\uDD16', '\uD835\uDD17', '\uD835\uDD18', '\uD835\uDD19', '\uD835\uDD1A', '\uD835\uDD1B',
  '\uD835\uDD1C', '\u2128',
];

export function mapChars(text: string, lookup: (ch: string) => string): string {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    out += lookup(text[i]);
  }
  return out;
}

export function mapAlphaRange(text: string, upperBaseCp: number, lowerBaseCp: number): string {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      out += String.fromCodePoint(upperBaseCp + (code - 65));
    } else if (code >= 97 && code <= 122) {
      out += String.fromCodePoint(lowerBaseCp + (code - 97));
    } else {
      out += text[i];
    }
  }
  return out;
}

export function prefixLines(content: string, prefix: string): string {
  return content
    .split('\n')
    .map((line) => (line.trim().length > 0 && !line.startsWith(prefix) ? `${prefix}${line}` : line))
    .join('\n');
}

export function createTextStylePlugin(
  transform: (content: string) => string,
): PluginImplementation {
  let unpatch: (() => void) | null = null;

  return definePlugin({
    start() {
      if (unpatch) {
        return;
      }
      unpatch = patchOutgoingMessageContent((content) => {
        if (!content || !content.trim()) {
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
