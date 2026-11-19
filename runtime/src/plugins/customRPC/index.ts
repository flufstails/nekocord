import {
  getFluxDispatcher,
  onFluxDispatcher,
  type FluxDispatcher,
} from '../../metro/common.js';
import { findByProps } from '../../metro/index.js';
import { subscribeSettings } from '../../storage/index.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const RPC_SOCKET_ID = 'NekocordCustomRPC';
const DEFAULT_APP_ID = '1300000000000000000';
const SNOWFLAKE_RE = /^\d{17,20}$/;

const settings = definePluginSettings({
  activityType: {
    type: OptionType.SELECT,
    label: 'Activity Type',
    description: 'Verb shown above your activity card on your profile.',
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
    description: 'Main title displayed on your activity card.',
    placeholder: 'Nekocord Mobile',
    default: 'Nekocord Mobile',
  },
  details: {
    type: OptionType.STRING,
    label: 'Details Line',
    description: 'First line shown below the activity title.',
    placeholder: 'Your cutest Discord client',
    default: 'Your cutest Discord client',
  },
  state: {
    type: OptionType.STRING,
    label: 'State Line',
    description: 'Second line shown below details.',
    placeholder: 'Active on Android',
    default: 'Active on Android',
  },
  applicationId: {
    type: OptionType.STRING,
    label: 'Application ID (Optional)',
    description: 'Optional custom Discord Application ID if you want custom assets.',
    placeholder: 'Leave blank for default',
    default: '',
  },
  streamUrl: {
    type: OptionType.STRING,
    label: 'Stream URL (Streaming Type Only)',
    description: 'Twitch or YouTube link used when Activity Type is set to Streaming.',
    placeholder: 'https://twitch.tv/flufstails',
    default: '',
  },
  largeImageText: {
    type: OptionType.STRING,
    label: 'Hover Image Caption',
    description: 'Caption text shown on the activity card emblem.',
    placeholder: 'Nekocord v1.5.0',
    default: 'Nekocord',
  },
  showTimestamp: {
    type: OptionType.BOOLEAN,
    label: 'Show Elapsed Timer',
    description: 'Show a running timer counting how long this activity has been active.',
    default: true,
  },
  status: {
    type: OptionType.SELECT,
    label: 'Online Status Override',
    description: 'Optionally set your online status while CustomRPC is active.',
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
let pendingConnectTimer: ReturnType<typeof setTimeout> | null = null;
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
  const rawAppId = String(settings.store.applicationId || '').trim();
  const appId = SNOWFLAKE_RE.test(rawAppId)
    ? rawAppId
    : largeText
      ? DEFAULT_APP_ID
      : undefined;

  const activity: Record<string, any> = {
    ...(appId ? { application_id: appId } : {}),
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

function applySafeOnlineStatus(nextStatus: string): void {
  try {
    const holder =
      findByProps<any>('PreloadedUserSettingsActionCreators')?.PreloadedUserSettingsActionCreators ??
      findByProps<any>('updateAsync', 'scheduleSave');
    if (typeof holder?.updateAsync === 'function') {
      holder.updateAsync(
        'status',
        (data: any) => {
          if (data && typeof data === 'object') {
            data.status = { value: nextStatus };
          }
        },
        0,
      );
    }
  } catch {
    // Skip status override if preloaded user settings action creator differs.
  }
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
    applySafeOnlineStatus(String(settings.store.status));
  }
}

const onConnectionOpen = () => {
  if (pendingConnectTimer) {
    clearTimeout(pendingConnectTimer);
  }
  pendingConnectTimer = setTimeout(() => {
    pendingConnectTimer = null;
    if (running) {
      broadcastPresence(true);
    }
  }, 0);
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
    if (pendingConnectTimer) {
      clearTimeout(pendingConnectTimer);
      pendingConnectTimer = null;
    }
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
