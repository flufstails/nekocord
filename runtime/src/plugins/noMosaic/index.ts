import { registerMessageRowTransformer } from '../../chat/rows.js';
import { findByProps, waitFor } from '../../metro/index.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let unregisterRowTransformer: (() => void) | null = null;
let cancelMosaicWait: (() => void) | null = null;
let unpatchMosaic: Unpatch | null = null;
let disabledCount = 0;

function patchMosaicModule(mod: any): boolean {
  if (unpatchMosaic || !mod || typeof mod.shouldShowMosaic !== 'function') {
    return false;
  }
  try {
    unpatchMosaic = instead(mod, 'shouldShowMosaic', () => false);
    return true;
  } catch {
    return false;
  }
}

export default definePlugin({
  start() {
    unregisterRowTransformer = registerMessageRowTransformer((row) => {
      const msg = row.message;
      if (msg && typeof msg === 'object' && msg.useAttachmentGridLayout === true) {
        msg.useAttachmentGridLayout = false;
        disabledCount += 1;
        return true;
      }
      return false;
    });

    const existing = findByProps('shouldShowMosaic');
    if (!patchMosaicModule(existing)) {
      cancelMosaicWait = waitFor(
        (m) => typeof m === 'object' && m !== null && typeof m.shouldShowMosaic === 'function',
        (mod) => {
          patchMosaicModule(mod);
        },
      );
    }
  },

  stop() {
    if (unregisterRowTransformer) {
      unregisterRowTransformer();
      unregisterRowTransformer = null;
    }
    if (cancelMosaicWait) {
      cancelMosaicWait();
      cancelMosaicWait = null;
    }
    if (unpatchMosaic) {
      unpatchMosaic();
      unpatchMosaic = null;
    }
  },
});
