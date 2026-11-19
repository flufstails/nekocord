import { getChannelStore, getUserStore, onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { pushNotification } from '../../notifications/index.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const LOCAL_SELECT_GRACE_MS = 1500;

const settings = definePluginSettings({
  notifyDisconnect: {
    type: OptionType.BOOLEAN,
    label: 'Alert on Forced Disconnect',
    description: 'Show an alert when someone disconnects you from a voice channel.',
    default: true,
  },
  notifyMove: {
    type: OptionType.BOOLEAN,
    label: 'Alert on Moved Channel',
    description: 'Show an alert when a moderator moves you to another voice channel.',
    default: true,
  },
  showToast: {
    type: OptionType.BOOLEAN,
    label: 'Show Floating Banner',
    description: 'Pop up a banner at the top of Discord when moved or disconnected.',
    default: true,
  },
});

let dispatcherRef: FluxDispatcher | null = null;
let cancelWait: (() => void) | null = null;
let lastKnownChannelId: string | null = null;
let lastLocalSelectAt = 0;

const onVoiceSelect = (action: Record<string, any>) => {
  lastLocalSelectAt = Date.now();
  lastKnownChannelId = action?.channelId ? String(action.channelId) : null;
};

const onVoiceStateUpdates = (action: Record<string, any>) => {
  const updates = Array.isArray(action.voiceStates) ? action.voiceStates : [];
  if (updates.length === 0) return;

  const selfId = getUserStore()?.getCurrentUser?.()?.id;
  if (!selfId) return;

  for (let i = 0; i < updates.length; i += 1) {
    const st = updates[i];
    if (!st || String(st.userId ?? '') !== String(selfId)) continue;

    const nextCh = st.channelId ? String(st.channelId) : null;
    const prevCh = st.oldChannelId !== undefined
      ? (st.oldChannelId ? String(st.oldChannelId) : null)
      : lastKnownChannelId;
    lastKnownChannelId = nextCh;

    if (!prevCh || nextCh === prevCh) continue;
    if (Date.now() - lastLocalSelectAt < LOCAL_SELECT_GRACE_MS) continue;

    const oldName = getChannelStore()?.getChannel?.(prevCh)?.name || 'voice channel';
    if (!nextCh && settings.store.notifyDisconnect) {
      pushNotification({
        title: 'Disconnected From Voice',
        body: `You were disconnected from ${oldName}.`,
        source: 'VoiceDisconnectAlert',
        kind: 'warning',
        showToast: Boolean(settings.store.showToast),
        channelId: prevCh,
      });
    } else if (nextCh && settings.store.notifyMove) {
      const nextName = getChannelStore()?.getChannel?.(nextCh)?.name || 'another voice channel';
      pushNotification({
        title: 'Moved Voice Channel',
        body: `You were moved from ${oldName} to ${nextName}.`,
        source: 'VoiceDisconnectAlert',
        kind: 'warning',
        showToast: Boolean(settings.store.showToast),
        channelId: nextCh,
      });
    }
  }
};

export default definePlugin({
  settings,
  start() {
    lastKnownChannelId = null;
    lastLocalSelectAt = 0;
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (!dispatcherRef) {
        dispatcherRef = dispatcher;
        dispatcher.subscribe('VOICE_CHANNEL_SELECT', onVoiceSelect);
        dispatcher.subscribe('VOICE_STATE_UPDATES', onVoiceStateUpdates);
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('VOICE_CHANNEL_SELECT', onVoiceSelect);
      dispatcherRef.unsubscribe('VOICE_STATE_UPDATES', onVoiceStateUpdates);
      dispatcherRef = null;
    }
    lastKnownChannelId = null;
  },
});
