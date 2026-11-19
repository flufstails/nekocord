import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin(
  (a) => a.type === 'VOICE_CHANNEL_EFFECT_SEND' || a.type === 'GUILD_SOUNDBOARD_SOUND_PLAY',
);
