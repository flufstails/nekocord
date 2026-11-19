import { patchOutgoingUploads } from '../../utils/uploader.js';
import { definePlugin } from '../types.js';

const CAMERA_PREFIX_RE = /^(?:IMG|PXL|DSC|VID|MVIMG)[_-]?\d+/i;
const EXT_RE = /(\.[a-zA-Z0-9]{1,10})$/;

let unpatchUploads: (() => void) | null = null;

function sanitizeName(name: string): string | null {
  const hasSpoiler = name.indexOf('SPOILER_') === 0;
  const clean = hasSpoiler ? name.slice(8) : name;
  if (!CAMERA_PREFIX_RE.test(clean)) return null;
  const m = clean.match(EXT_RE);
  const ext = m ? m[1].toLowerCase() : '';
  const suffix = Math.floor(Math.random() * 0xffffff).toString(16);
  return `${hasSpoiler ? 'SPOILER_' : ''}image_${suffix}${ext}`;
}

export default definePlugin({
  start() {
    if (unpatchUploads) return;
    unpatchUploads = patchOutgoingUploads((item) => {
      const next = item.filename ? sanitizeName(item.filename) : null;
      if (next) {
        item.setFilename(next);
      }
    });
  },

  stop() {
    unpatchUploads?.();
    unpatchUploads = null;
  },
});
