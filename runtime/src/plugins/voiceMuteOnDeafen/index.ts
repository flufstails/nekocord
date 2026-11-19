import { getStore } from '../../metro/common.js';
import { findByProps } from '../../metro/index.js';
import { createDispatcherObserverPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherObserverPlugin('AUDIO_TOGGLE_SELF_DEAF', () => {
  const media = getStore<any>('MediaEngineStore');
  if (media?.isSelfDeaf?.() && !media?.isSelfMute?.()) {
    const actions = findByProps('toggleSelfMute', 'toggleSelfDeaf');
    actions?.toggleSelfMute?.();
  }
});
