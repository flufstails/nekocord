import { createDispatcherInterceptorPlugin } from '../_shared/fluxAndPrivacy.js';
import { definePluginSettings, OptionType } from '../settings.js';

const settings = definePluginSettings({
  cooldownSeconds: {
    type: OptionType.SELECT,
    label: 'Ping Cooldown',
    description: 'Suppress repeated DM notification pings from the same channel inside this window.',
    default: 10,
    options: [
      { label: '5s', value: 5 },
      { label: '10s', value: 10 },
      { label: '30s', value: 30 },
      { label: '60s', value: 60 },
    ],
  },
});

const lastPingByChannel = new Map<string, number>();

const impl = createDispatcherInterceptorPlugin((action) => {
  if (action.type !== 'LOCAL_NOTIFICATION_SHOW_PUSH' && action.type !== 'MESSAGE_NOTIFICATION') {
    return;
  }
  const chId = action.channelId ?? action.message?.channel_id;
  if (!chId) return;
  const now = Date.now();
  const cooldownMs = Number(settings.store.cooldownSeconds) * 1000;
  const prev = lastPingByChannel.get(String(chId)) ?? 0;
  if (now - prev < cooldownMs) {
    return false;
  }
  lastPingByChannel.set(String(chId), now);
});

export default { ...impl, settings };
