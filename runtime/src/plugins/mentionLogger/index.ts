import { pushNotification } from '../../notifications/index.js';
import { createDispatcherObserverPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherObserverPlugin('MESSAGE_CREATE', (action) => {
  const msg = action.message;
  if (!msg || !msg.mention_everyone) return;
  const who = msg.author?.globalName || msg.author?.username || 'Someone';
  pushNotification({
    title: `Channel Broadcast from ${who}`,
    body: typeof msg.content === 'string' && msg.content ? msg.content.slice(0, 140) : 'Sent a broadcast mention.',
    source: 'MentionLogger',
    kind: 'discord',
    showToast: true,
    ...(msg.channel_id ? { channelId: String(msg.channel_id) } : {}),
  });
});
