import { pushNotification } from '../../notifications/index.js';
import { createDispatcherObserverPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherObserverPlugin('GUILD_CREATE', (action) => {
  const g = action.guild;
  if (!g || !g.id || g.unavailable) return;
  const name = g.properties?.name || g.name || String(g.id);
  pushNotification({
    title: 'Server Connected',
    body: `Loaded server: ${name}`,
    source: 'GuildJoinLogger',
    kind: 'info',
    showToast: false,
    guildId: String(g.id),
  });
});
