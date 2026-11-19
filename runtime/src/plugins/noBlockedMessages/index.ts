import { getRelationshipStore, interceptFluxDispatcher } from '../../metro/common.js';
import { definePlugin } from '../types.js';

let hiddenCount = 0;
let stopIntercept: (() => void) | null = null;

function isBlockedOrIgnoredAuthor(authorId: unknown): boolean {
  if (!authorId) {
    return false;
  }
  const id = String(authorId);
  const store = getRelationshipStore();
  if (!store) {
    return false;
  }
  try {
    if (typeof store.isBlockedOrIgnored === 'function' && store.isBlockedOrIgnored(id)) {
      return true;
    }
    if (typeof store.isBlocked === 'function' && store.isBlocked(id)) {
      return true;
    }
    if (typeof store.isIgnored === 'function' && store.isIgnored(id)) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Returns the number of blocked or ignored messages filtered out.
 */
export function getHiddenBlockedCount(): number {
  return hiddenCount;
}

export default definePlugin({
  start() {
    if (stopIntercept) return;
    stopIntercept = interceptFluxDispatcher((action, args, orig) => {
      if (action.type === 'MESSAGE_CREATE') {
        const authorId = action.message?.author?.id;
        if (isBlockedOrIgnoredAuthor(authorId)) {
          hiddenCount += 1;
          return undefined;
        }
      } else if (action.type === 'LOAD_MESSAGES_SUCCESS' && Array.isArray(action.messages)) {
        const filtered = action.messages.filter(
          (msg: any) => !isBlockedOrIgnoredAuthor(msg?.author?.id),
        );
        if (filtered.length !== action.messages.length) {
          hiddenCount += action.messages.length - filtered.length;
          return orig({ ...action, messages: filtered });
        }
      }

      return orig(...args);
    });
  },

  stop() {
    stopIntercept?.();
    stopIntercept = null;
  },
});
