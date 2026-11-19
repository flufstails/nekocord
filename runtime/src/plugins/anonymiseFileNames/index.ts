import { patchOutgoingUploads } from '../../utils/uploader.js';
import { definePlugin } from '../types.js';

const EXT_RE = /(\.[a-zA-Z0-9]{1,10})$/;

let anonymisedCount = 0;
let unpatchUploads: (() => void) | null = null;

function randomHex8(): string {
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

function buildAnonymisedName(originalName: string): string {
  const hasSpoiler = originalName.indexOf('SPOILER_') === 0;
  const baseName = hasSpoiler ? originalName.slice(8) : originalName;
  const match = baseName.match(EXT_RE);
  const ext = match ? match[1].toLowerCase() : '';
  return `${hasSpoiler ? 'SPOILER_' : ''}${randomHex8()}${ext}`;
}

/**
 * Returns the number of uploaded file names randomized before upload.
 */
export function getAnonymisedUploadCount(): number {
  return anonymisedCount;
}

export default definePlugin({
  start() {
    if (unpatchUploads) return;
    unpatchUploads = patchOutgoingUploads((item) => {
      if (item.raw?.isVoiceMessage) {
        return;
      }
      const rawName = item.filename;
      if (!rawName || rawName === 'voice-message.ogg') {
        return;
      }
      const nextName = buildAnonymisedName(rawName);
      item.setFilename(nextName);
      anonymisedCount += 1;
      console.log(`[Nekocord/AnonymiseFileNames] Renamed ${rawName} -> ${nextName}`);
    });
  },

  stop() {
    unpatchUploads?.();
    unpatchUploads = null;
  },
});
