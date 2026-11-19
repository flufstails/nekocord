import { onFluxDispatcher } from '../../metro/common.js';
import { findByProps, waitFor } from '../../metro/index.js';
import { before, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let mutedReplyCount = 0;
let cancelReplyWait: (() => void) | null = null;
let cancelDispatcherWait: (() => void) | null = null;
let unpatchCreateReply: Unpatch | null = null;
let unpatchDispatch: Unpatch | null = null;

/**
 * Returns how many reply mentions were automatically disabled.
 */
export function getMutedReplyCount(): number {
  return mutedReplyCount;
}

export default definePlugin({
  start() {
    const patchReplyCreators = (mod: any) => {
      if (unpatchCreateReply || typeof mod?.createPendingReply !== 'function') {
        return;
      }
      unpatchCreateReply = before(mod, 'createPendingReply', (opts: any) => {
        if (opts && typeof opts === 'object' && opts.shouldMention !== false) {
          opts.shouldMention = false;
          mutedReplyCount += 1;
        }
      });
    };

    const existing = findByProps('createPendingReply');
    if (existing) {
      patchReplyCreators(existing);
    } else {
      cancelReplyWait = waitFor(
        (m) =>
          typeof m === 'object' &&
          m !== null &&
          typeof m.createPendingReply === 'function',
        patchReplyCreators,
      );
    }

    cancelDispatcherWait = onFluxDispatcher((dispatcher) => {
      if (unpatchDispatch) {
        return;
      }
      unpatchDispatch = before(dispatcher, 'dispatch', (action: any) => {
        if (
          action &&
          action.type === 'CREATE_PENDING_REPLY' &&
          action.shouldMention !== false
        ) {
          action.shouldMention = false;
          mutedReplyCount += 1;
        }
      });
    });
  },

  stop() {
    if (cancelReplyWait) {
      cancelReplyWait();
      cancelReplyWait = null;
    }
    if (cancelDispatcherWait) {
      cancelDispatcherWait();
      cancelDispatcherWait = null;
    }
    if (unpatchCreateReply) {
      unpatchCreateReply();
      unpatchCreateReply = null;
    }
    if (unpatchDispatch) {
      unpatchDispatch();
      unpatchDispatch = null;
    }
  },
});
