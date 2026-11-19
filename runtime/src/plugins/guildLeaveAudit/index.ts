import { createDispatcherObserverPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherObserverPlugin('GUILD_DELETE', (a) => (a.guild?.id ? `Guild ${a.guild.id}` : null));
