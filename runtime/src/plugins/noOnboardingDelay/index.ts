import { createDispatcherInterceptorPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherInterceptorPlugin((action) => {
  if (action.type.startsWith('GUILD_ONBOARDING')) {
    if (typeof action.delay === 'number') action.delay = 0;
    if (typeof action.cooldown === 'number') action.cooldown = 0;
  }
});
