import { createDispatcherObserverPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherObserverPlugin('VOICE_STATE_UPDATES', (a) => {
      const states = Array.isArray(a.voiceStates) ? a.voiceStates : [];
      const first = states[0];
      return first?.userId ? `User ${first.userId}` : null;
    });
