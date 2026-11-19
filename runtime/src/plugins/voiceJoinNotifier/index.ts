import { getStore, getUserStore, onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { pushNotification } from '../../notifications/index.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  notifyJoins: {
    type: OptionType.BOOLEAN,
    label: 'Notify on User Join',
    description: 'Log when a user joins your current voice channel.',
    default: true,
  },
  notifyLeaves: {
    type: OptionType.BOOLEAN,
    label: 'Notify on User Leave',
    description: 'Log when a user leaves your current voice channel.',
    default: true,
  },
  showToast: {
    type: OptionType.BOOLEAN,
    label: 'Show Floating Toast',
    description: 'Display an in-app Nekocord toast banner on voice channel changes.',
    default: true,
  },
});

const prevChannels = new Map<string, string | null>();
let dispatcherRef: FluxDispatcher | null = null;
let cancelWait: (() => void) | null = null;

const onVoiceStateUpdates = (action: Record<string, any>) => {
  const updates = Array.isArray(action.voiceStates) ? action.voiceStates : [];
  if (updates.length === 0) return;

  const userStore = getUserStore();
  const selfId = userStore?.getCurrentUser?.()?.id ? String(userStore.getCurrentUser().id) : '';
  const vsStore = getStore<{ getVoiceChannelId?: (userId?: string) => string | null }>('VoiceStateStore');
  const myChannelId = selfId ? vsStore?.getVoiceChannelId?.(selfId) ?? null : null;

  for (let i = 0; i < updates.length; i += 1) {
    const st = updates[i];
    if (!st || typeof st !== 'object') continue;
    const uid = st.userId ? String(st.userId) : '';
    if (!uid || (selfId && uid === selfId)) continue;

    const nextChannel = st.channelId ? String(st.channelId) : null;
    const prevChannel = prevChannels.get(uid) ?? null;
    prevChannels.set(uid, nextChannel);

    if (!myChannelId || nextChannel === prevChannel) continue;

    const user = userStore?.getUser?.(uid);
    const uname = user?.globalName || user?.username || `User ${uid}`;

    if (nextChannel === myChannelId && settings.store.notifyJoins) {
      pushNotification({
        title: 'Voice Join',
        body: `${uname} joined your voice channel.`,
        source: 'VoiceJoinNotifier',
        kind: 'info',
        showToast: Boolean(settings.store.showToast),
        channelId: myChannelId,
      });
    } else if (prevChannel === myChannelId && nextChannel !== myChannelId && settings.store.notifyLeaves) {
      pushNotification({
        title: 'Voice Leave',
        body: `${uname} left your voice channel.`,
        source: 'VoiceJoinNotifier',
        kind: 'info',
        showToast: Boolean(settings.store.showToast),
        channelId: myChannelId,
      });
    }
  }
};

export default definePlugin({
  settings,
  start() {
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (!dispatcherRef) {
        dispatcherRef = dispatcher;
        dispatcher.subscribe('VOICE_STATE_UPDATES', onVoiceStateUpdates);
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('VOICE_STATE_UPDATES', onVoiceStateUpdates);
      dispatcherRef = null;
    }
    prevChannels.clear();
  },
});
