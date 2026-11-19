import { createDispatcherInterceptorPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherInterceptorPlugin((action) => {
  if (action.type === 'GUILD_UPDATE' && action.guild?.invitesDisabledUntil) {
    action.guild.invitesDisabledUntil = null;
  }
});
