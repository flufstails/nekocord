import { findByProps, watchNamedExports } from '../../metro/index.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';
import { definePlugin } from '../types.js';

const BLOCKED_RING_SOUNDS = new Set(['call_ringing', 'call_ringing_beat', 'incoming_call']);
const SOUND_TARGETS = new Set(['playSound']);

const dispatcherBlocker = createDispatcherBlockerPlugin((action) => {
  if (action.type === 'CALL_RING' && action.ringing === true) {
    return true;
  }
  if (
    action.type === 'AUDIO_PLAY_SOUND' &&
    typeof action.sound === 'string' &&
    BLOCKED_RING_SOUNDS.has(action.sound)
  ) {
    return true;
  }
  return false;
});

const unpatches: Unpatch[] = [];
let cancelWatch: (() => void) | null = null;
let patchedObjs = new WeakSet<object>();

function hookSoundTarget(target: any, key: string): void {
  if (!target || typeof target[key] !== 'function' || patchedObjs.has(target)) {
    return;
  }
  patchedObjs.add(target);
  try {
    unpatches.push(
      instead(target, key, (args: any[], orig: (...a: any[]) => any) => {
        const soundName = typeof args[0] === 'string' ? args[0] : '';
        if (BLOCKED_RING_SOUNDS.has(soundName)) {
          return undefined;
        }
        return orig(...args);
      }),
    );
  } catch {
    // Ignore locked sound module exports.
  }
}

export default definePlugin({
  start() {
    dispatcherBlocker.start?.();
    const existing = findByProps('playSound', 'stopSound');
    if (existing) {
      hookSoundTarget(existing, 'playSound');
    }
    cancelWatch = watchNamedExports(SOUND_TARGETS, (hit) => {
      hookSoundTarget(hit.target, hit.key);
    });
  },
  stop() {
    dispatcherBlocker.stop?.();
    cancelWatch?.();
    cancelWatch = null;
    while (unpatches.length > 0) {
      unpatches.pop()?.();
    }
    patchedObjs = new WeakSet<object>();
  },
});
