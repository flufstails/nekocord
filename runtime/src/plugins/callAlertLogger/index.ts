import { pushNotification } from '../../notifications/index.js';
import { createDispatcherObserverPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherObserverPlugin('CALL_CREATE', (action) => {
  const chId = action.channelId ? String(action.channelId) : '';
  pushNotification({
    title: 'Incoming Voice Call',
    body: chId ? `Call started in channel ${chId}.` : 'A voice call started.',
    source: 'CallAlertLogger',
    kind: 'discord',
    showToast: true,
    ...(chId ? { channelId: chId } : {}),
  });
});
