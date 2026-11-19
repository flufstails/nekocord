import {
  getFluxDispatcher,
  onFluxDispatcher,
  type FluxDispatcher,
} from '../../metro/common.js';
import { subscribeSettings } from '../../storage/index.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const RPC_SOCKET_ID = 'NekocordCustomRPC';

const settings = definePluginSettings({
  activityType: {
    type: OptionType.SELECT,
    label: 'Activity Type',
    description: 'Presence verb shown above your activity card on your Discord profile.',
    options: [
      { label: 'Playing', value: 0 },
      { label: 'Streaming', value: 1 },
      { label: 'Listening', value: 2 },
      { label: 'Watching', value: 3 },
      { label: 'Competing', value: 5 },
    ],
    default: 0,
  },
  name: {
    type: OptionType.STRING,
    label: 'Activity Name',
    description: 'Main application or activity title displayed on your profile.',
    placeholder: 'Nekocord Mobile',
    default: 'Nekocord Mobile',
  },
  details: {
    type: OptionType.STRING,
    label: 'Details Line',
    description: 'First descriptive line below the activity name.',
    placeholder: 'Your cutest Discord client',
    default: 'Your cutest Discord client',
  },
  state: {
    type: OptionType.STRING,
    label: 'State Line',
    description: 'Second descriptive line below details.',
    placeholder: 'Active on Android',
    default: 'Active on Android',
  },
  streamUrl: {
    type: OptionType.STRING,
    label: 'Stream URL (Streaming Type Only)',
    description: 'Twitch or YouTube URL required when Activity Type is Streaming.',
    placeholder: 'https://twitch.tv/flufstails',
    default: '',
  },
  largeImageText: {
    type: OptionType.STRING,
    label: 'Hover Image Caption',
    description: 'Tooltip text for the activity card emblem.',
    placeholder: 'Nekocord v1.4.0',
    default: 'Nekocord',
  },
  showTimestamp: {
    type: OptionType.BOOLEAN,
    label: 'Show Elapsed Timer',
    description: 'Display live elapsed session time since CustomRPC started.',
    default: true,
  },
  status: {
    type: OptionType.SELECT,
    label: 'Online Status Override',
    description: 'Optionally set Discord presence status alongside Rich Presence.',
    options: [
      { label: 'Keep Current', value: 'keep' },
      { label: 'Online', value: 'online' },
      { label: 'Idle', value: 'idle' },
      { label: 'Do Not Disturb', value: 'dnd' },
      { label: 'Invisible', value: 'invisible' },
    ],
    default: 'keep',
  },
});

let running = false;
let sessionStartedAt = 0;
let subscribedDispatcher: FluxDispatcher | null = null;
let cancelDispatcherWait: (() => void) | null = null;
let unsubscribeStorage: (() => void) | null = null;
let lastSignature = '';

function buildActivityPayload(): Record<string, any> | null {
  const name = String(settings.store.name || '').trim();
  if (!name) {
    return null;
  }
  const type = Number(settings.store.activityType) || 0;
  const details = String(settings.store.details || '').trim();
  const state = String(settings.store.state || '').trim();
  const streamUrl = String(settings.store.streamUrl || '').trim();
  const largeText = String(settings.store.largeImageText || '').trim();

  const activity: Record<string, any> = {
    application_id: '1300000000000000000',
    name,
    type,
    ...(details ? { details } : {}),
    ...(state ? { state } : {}),
    ...(type === 1 && /^https?:\/\/(?:www\.)?(?:twitch\.tv|youtube\.com)\//i.test(streamUrl)
      ? { url: streamUrl }
      : {}),
    ...(settings.store.showTimestamp ? { timestamps: { start: sessionStartedAt || Date.now() } } : {}),
    ...(largeText ? { assets: { large_text: largeText } } : {}),
  };

  return activity;
}

function broadcastPresence(force = false): void {
  if (!running) return;
  const dispatcher = subscribedDispatcher ?? getFluxDispatcher();
  if (!dispatcher?.dispatch) return;

  const activity = buildActivityPayload();
  const sig = JSON.stringify({ activity, status: settings.store.status });
  if (!force && sig === lastSignature) {
    return;
  }
  lastSignature = sig;

  dispatcher.dispatch({
    type: 'LOCAL_ACTIVITY_UPDATE',
    activity,
    socketId: RPC_SOCKET_ID,
  });

  if (settings.store.status && settings.store.status !== 'keep') {
    dispatcher.dispatch({
      type: 'USER_SETTINGS_PROTO_UPDATE',
      settings: { status: settings.store.status },
      local: true,
    });
  }
}

const onConnectionOpen = () => {
  broadcastPresence(true);
};

export default definePlugin({
  settings,
  start() {
    running = true;
    sessionStartedAt = Date.now();
    lastSignature = '';

    cancelDispatcherWait = onFluxDispatcher((dispatcher) => {
      if (!running) return;
      if (subscribedDispatcher !== dispatcher) {
        subscribedDispatcher = dispatcher;
        dispatcher.subscribe('CONNECTION_OPEN', onConnectionOpen);
      }
      broadcastPresence(true);
    });

    unsubscribeStorage = subscribeSettings(() => {
      broadcastPresence(false);
    });
  },

  stop() {
    running = false;
    lastSignature = '';
    cancelDispatcherWait?.();
    cancelDispatcherWait = null;
    unsubscribeStorage?.();
    unsubscribeStorage = null;

    if (subscribedDispatcher) {
      subscribedDispatcher.unsubscribe('CONNECTION_OPEN', onConnectionOpen);
      subscribedDispatcher.dispatch({
        type: 'LOCAL_ACTIVITY_UPDATE',
        activity: null,
        socketId: RPC_SOCKET_ID,
      });
      subscribedDispatcher = null;
    } else {
      getFluxDispatcher()?.dispatch({
        type: 'LOCAL_ACTIVITY_UPDATE',
        activity: null,
        socketId: RPC_SOCKET_ID,
      });
    }
  },
});
