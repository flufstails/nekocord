import { findByProps, waitFor } from '../../metro/index.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let cancelWait: (() => void) | null = null;
let unpatchVoiceState: Unpatch | null = null;

function patchVoice(mod: any): void {
  if (unpatchVoiceState || typeof mod?.voiceStateUpdate !== 'function') {
    return;
  }
  unpatchVoiceState = instead(mod, 'voiceStateUpdate', (args, orig) => {
    const first = args[0];
    if (first && typeof first === 'object') {
      const channelId = first.channelId ?? first.channel_id;
      if (channelId != null) {
        if ('self_mute' in first) {
          first.self_mute = true;
        }
        if ('selfMute' in first || !('self_mute' in first)) {
          first.selfMute = true;
        }
      }
    } else if (args.length >= 3 && args[1] != null && typeof args[2] === 'boolean') {
      args[2] = true;
    }
    return orig(...args);
  });
}

export default definePlugin({
  start() {
    const existing = findByProps('voiceStateUpdate');
    if (existing) {
      patchVoice(existing);
    } else {
      cancelWait = waitFor(
        (m) => typeof m === 'object' && m !== null && typeof m.voiceStateUpdate === 'function',
        patchVoice,
      );
    }
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    unpatchVoiceState?.();
    unpatchVoiceState = null;
  },
});
