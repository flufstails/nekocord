import { findByProps, waitFor } from '../../metro/index.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let spoofedCount = 0;
let cancelWait: (() => void) | null = null;
let unpatchVoiceState: Unpatch | null = null;

/**
 * Returns how many voice state updates had self-mute/self-deafen spoofed.
 */
export function getFakeDeafenCount(): number {
  return spoofedCount;
}

export default definePlugin({
  start() {
    const patchVoice = (mod: any) => {
      if (unpatchVoiceState || typeof mod?.voiceStateUpdate !== 'function') {
        return;
      }
      unpatchVoiceState = instead(mod, 'voiceStateUpdate', (args, orig) => {
        const first = args[0];
        if (first && typeof first === 'object') {
          const channelId = first.channelId ?? first.channel_id;
          if (channelId != null) {
            if ('self_deaf' in first || 'self_mute' in first) {
              first.self_mute = true;
              first.self_deaf = true;
            }
            if (
              'selfDeaf' in first ||
              'selfMute' in first ||
              (!('self_deaf' in first) && !('self_mute' in first))
            ) {
              first.selfMute = true;
              first.selfDeaf = true;
            }
            spoofedCount += 1;
          }
        } else if (
          args.length >= 4 &&
          args[1] != null &&
          typeof args[2] === 'boolean' &&
          typeof args[3] === 'boolean'
        ) {
          args[2] = true;
          args[3] = true;
          spoofedCount += 1;
        }
        return orig(...args);
      });
    };

    const existing = findByProps('voiceStateUpdate');
    if (existing) {
      patchVoice(existing);
    } else {
      cancelWait = waitFor(
        (m) =>
          typeof m === 'object' &&
          m !== null &&
          typeof m.voiceStateUpdate === 'function',
        patchVoice,
      );
    }
  },

  stop() {
    if (cancelWait) {
      cancelWait();
      cancelWait = null;
    }
    if (unpatchVoiceState) {
      unpatchVoiceState();
      unpatchVoiceState = null;
    }
  },
});
