import { findByProps, waitFor } from '../../metro/index.js';
import { before, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const EXT_RE = /(\.[a-zA-Z0-9]{1,10})$/;

let anonymisedCount = 0;
let cancelWait: (() => void) | null = null;
let unpatchUpload: Unpatch | null = null;

function randomHex8(): string {
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

function buildAnonymisedName(originalName: string): string {
  const match = originalName.match(EXT_RE);
  const ext = match ? match[1].toLowerCase() : '';
  return `${randomHex8()}${ext}`;
}

function anonymiseUploadList(items: unknown[]): void {
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i] as Record<string, any> | undefined;
    if (!item || typeof item !== 'object') {
      continue;
    }

    const rawName =
      typeof item.filename === 'string'
        ? item.filename
        : typeof item.file?.name === 'string'
          ? item.file.name
          : typeof item.name === 'string'
            ? item.name
            : '';

    if (!rawName) {
      continue;
    }

    const nextName = buildAnonymisedName(rawName);
    let modified = false;

    if (typeof item.filename === 'string') {
      item.filename = nextName;
      modified = true;
    }
    if (item.file && typeof item.file === 'object' && typeof item.file.name === 'string') {
      item.file.name = nextName;
      modified = true;
    }
    if (!modified && typeof item.name === 'string') {
      item.name = nextName;
      modified = true;
    }

    if (modified) {
      anonymisedCount += 1;
    }
  }
}

/**
 * Returns the number of uploaded file names randomized before upload.
 */
export function getAnonymisedUploadCount(): number {
  return anonymisedCount;
}

export default definePlugin({
  start() {
    const patchUploader = (mod: any) => {
      if (unpatchUpload || typeof mod?.uploadFiles !== 'function') {
        return;
      }
      unpatchUpload = before(mod, 'uploadFiles', (...args: any[]) => {
        if (Array.isArray(args[0])) {
          anonymiseUploadList(args[0]);
        } else if (args[0] && typeof args[0] === 'object' && Array.isArray(args[0].uploads)) {
          anonymiseUploadList(args[0].uploads);
        }
      });
    };

    const existing = findByProps('uploadFiles');
    if (existing) {
      patchUploader(existing);
    } else {
      cancelWait = waitFor(
        (m) => typeof m === 'object' && m !== null && typeof m.uploadFiles === 'function',
        patchUploader,
      );
    }
  },

  stop() {
    if (cancelWait) {
      cancelWait();
      cancelWait = null;
    }
    if (unpatchUpload) {
      unpatchUpload();
      unpatchUpload = null;
    }
  },
});
