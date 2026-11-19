import { createDispatcherInterceptorPlugin } from '../_shared/fluxAndPrivacy.js';

const lastPingByChannel = new Map<string, number>();

export default createDispatcherInterceptorPlugin((action) => {
  if (action.type !== 'LOCAL_NOTIFICATION_SHOW_PUSH' && action.type !== 'MESSAGE_NOTIFICATION') {
    return;
  }
  const chId = action.channelId ?? action.message?.channel_id;
  if (!chId) return;
  const now = Date.now();
  const prev = lastPingByChannel.get(String(chId)) ?? 0;
  if (now - prev < 10_000) {
    return false;
  }
  lastPingByChannel.set(String(chId), now);
});
