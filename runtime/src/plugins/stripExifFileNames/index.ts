import { findByProps, waitFor } from '../../metro/index.js';
import { before, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const CAMERA_PREFIX_RE = /^(?:IMG|PXL|DSC|VID|MVIMG)_\d+/i;
const EXT_RE = /(\.[a-zA-Z0-9]{1,10})$/;

let cancelWait: (() => void) | null = null;
let unpatchUpload: Unpatch | null = null;

function sanitizeName(name: string): string | null {
  if (!CAMERA_PREFIX_RE.test(name)) return null;
  const m = name.match(EXT_RE);
  const ext = m ? m[1].toLowerCase() : '';
  const suffix = Math.floor(Math.random() * 0xffffff).toString(16);
  return `image_${suffix}${ext}`;
}

function sanitizeUploads(items: unknown[]): void {
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i] as Record<string, any> | undefined;
    if (!item || typeof item !== 'object') continue;
    const current =
      typeof item.filename === 'string'
        ? item.filename
        : typeof item.file?.name === 'string'
          ? item.file.name
          : typeof item.name === 'string'
            ? item.name
            : '';
    const next = current ? sanitizeName(current) : null;
    if (!next) continue;
    if (typeof item.filename === 'string') item.filename = next;
    if (item.file && typeof item.file === 'object' && typeof item.file.name === 'string') {
      item.file.name = next;
    }
    if (typeof item.name === 'string') item.name = next;
  }
}

export default definePlugin({
  start() {
    const patchUploader = (mod: any) => {
      if (unpatchUpload || typeof mod?.uploadFiles !== 'function') return;
      unpatchUpload = before(mod, 'uploadFiles', (...args: any[]) => {
        if (Array.isArray(args[0])) sanitizeUploads(args[0]);
        else if (args[0] && typeof args[0] === 'object' && Array.isArray(args[0].uploads)) {
          sanitizeUploads(args[0].uploads);
        }
      });
    };
    const existing = findByProps('uploadFiles');
    if (existing) patchUploader(existing);
    else {
      cancelWait = waitFor(
        (m) => typeof m === 'object' && m !== null && typeof m.uploadFiles === 'function',
        patchUploader,
      );
    }
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    unpatchUpload?.();
    unpatchUpload = null;
  },
});
