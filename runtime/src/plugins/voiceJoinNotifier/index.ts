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

const MAX_TRACKED_USERS = 2000;
const prevChannels = new Map<string, string | null>();
let dispatcherRef: FluxDispatcher | null = null;
let cancelWait: (() => void) | null = null;

function rememberUserChannel(uid: string, chId: string | null): void {
  if (!prevChannels.has(uid) && prevChannels.size >= MAX_TRACKED_USERS) {
    const oldest = prevChannels.keys().next().value;
    if (oldest !== undefined) {
      prevChannels.delete(oldest);
    }
  }
  prevChannels.set(uid, chId);
}

function resolveMyVoiceChannelId(selfId: string): string | null {
  const selected = getStore<{ getVoiceChannelId?: () => string | null }>(
    'SelectedChannelStore',
  )?.getVoiceChannelId?.();
  if (selected) return String(selected);

  const vsStore = getStore<any>('VoiceStateStore');
  const viaState = selfId ? vsStore?.getVoiceStateForUser?.(selfId)?.channelId : null;
  if (viaState) return String(viaState);

  const viaChannel = selfId ? vsStore?.getVoiceChannelId?.(selfId) : null;
  return viaChannel ? String(viaChannel) : null;
}

function seedChannelRoster(channelId: string | null, selfId: string): void {
  if (!channelId) return;
  const vsStore = getStore<any>('VoiceStateStore');
  const states = vsStore?.getVoiceStatesForChannel?.(channelId);
  if (!states || typeof states !== 'object') return;
  const list = Array.isArray(states) ? states : Object.values(states);
  for (let i = 0; i < list.length; i += 1) {
    const st = list[i] as any;
    const uid = st?.userId ? String(st.userId) : '';
    if (uid && uid !== selfId && !prevChannels.has(uid)) {
      rememberUserChannel(uid, channelId);
    }
  }
}

const onVoiceChannelSelect = (action: Record<string, any>) => {
  const selfId = getUserStore()?.getCurrentUser?.()?.id
    ? String(getUserStore()!.getCurrentUser().id)
    : '';
  const chId = action?.channelId ? String(action.channelId) : null;
  if (chId) {
    seedChannelRoster(chId, selfId);
  }
};

const onVoiceStateUpdates = (action: Record<string, any>) => {
  const updates = Array.isArray(action.voiceStates) ? action.voiceStates : [];
  if (updates.length === 0) return;

  const userStore = getUserStore();
  const selfId = userStore?.getCurrentUser?.()?.id ? String(userStore.getCurrentUser().id) : '';
  const myChannelId = resolveMyVoiceChannelId(selfId);

  for (let i = 0; i < updates.length; i += 1) {
    const st = updates[i];
    if (!st || typeof st !== 'object') continue;
    const uid = st.userId ? String(st.userId) : '';
    if (!uid || (selfId && uid === selfId)) continue;

    const nextChannel = st.channelId ? String(st.channelId) : null;
    const prevChannel =
      st.oldChannelId !== undefined
        ? (st.oldChannelId ? String(st.oldChannelId) : null)
        : (prevChannels.get(uid) ?? null);
    rememberUserChannel(uid, nextChannel);

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
    const selfId = getUserStore()?.getCurrentUser?.()?.id
      ? String(getUserStore()!.getCurrentUser().id)
      : '';
    seedChannelRoster(resolveMyVoiceChannelId(selfId), selfId);

    cancelWait = onFluxDispatcher((dispatcher) => {
      if (!dispatcherRef) {
        dispatcherRef = dispatcher;
        dispatcher.subscribe('VOICE_STATE_UPDATES', onVoiceStateUpdates);
        dispatcher.subscribe('VOICE_CHANNEL_SELECT', onVoiceChannelSelect);
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('VOICE_STATE_UPDATES', onVoiceStateUpdates);
      dispatcherRef.unsubscribe('VOICE_CHANNEL_SELECT', onVoiceChannelSelect);
      dispatcherRef = null;
    }
    prevChannels.clear();
  },
});
