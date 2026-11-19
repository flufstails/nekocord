import { definePlugin } from '../types.js';

const REACT_HINTS: Record<string, string> = {
  '31': 'Objects are not valid as a React child (use primitive text or element).',
  '185': 'Maximum update depth exceeded (state setter called inside render or unstable effect).',
  '300': 'Fewer hooks rendered than expected (conditional hook after early return).',
  '310': 'Rendered more hooks than during the previous render.',
  '418': 'Hydration text content mismatch.',
  '423': 'Hydration failed because initial UI did not match rendered tree.',
  '425': 'Text content did not match server-rendered output.',
};

let origError: ((...a: any[]) => void) | null = null;

export default definePlugin({
  start() {
    origError = console.error;
    console.error = (...args: any[]) => {
      origError?.apply(console, args);
      const first = typeof args[0] === 'string' ? args[0] : '';
      const match = /Minified React error #(\d+)/i.exec(first);
      if (match && REACT_HINTS[match[1]]) {
        origError?.call(console, `[ReactErrorDecoder #${match[1]}] ${REACT_HINTS[match[1]]}`);
      }
    };
  },
  stop() {
    if (origError) {
      console.error = origError;
      origError = null;
    }
  },
});
