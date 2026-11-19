import { getStore, onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { findByProps, watchNamedExports } from '../../metro/index.js';
import { definePlugin } from '../types.js';

const GRACE_PERIOD_MS = 10_000;
const NOTIF_TARGET_NAMES = new Set(['updateGuildNotificationSettings']);

let cancelDispatcherWait: (() => void) | null = null;
let cancelWatch: (() => void) | null = null;
let activeDispatcher: FluxDispatcher | null = null;
let updateSettingsFn: ((guildId: string, settings: Record<string, unknown>) => unknown) | null =
  null;
let startedAt = 0;
let mutedGuildCount = 0;
const knownGuildIds = new Set<string>();

function seedKnownGuilds(): void {
  try {
    const guildStore = getStore<{
      getGuilds?: () => Record<string, any>;
      getGuildIds?: () => string[];
    }>('GuildStore');
    const ids = guildStore?.getGuildIds?.();
    if (Array.isArray(ids)) {
      for (const id of ids) {
        knownGuildIds.add(String(id));
      }
      return;
    }
    const guilds = guildStore?.getGuilds?.();
    if (guilds && typeof guilds === 'object') {
      for (const id of Object.keys(guilds)) {
        knownGuildIds.add(id);
      }
    }
  } catch {
    // Ignore store access errors during startup.
  }
}

function handleGuildCreate(action: any): void {
  const guildId = action?.guild?.id ? String(action.guild.id) : '';
  if (!guildId) {
    return;
  }
  if (knownGuildIds.has(guildId)) {
    return;
  }
  knownGuildIds.add(guildId);

  if (Date.now() - startedAt < GRACE_PERIOD_MS || !updateSettingsFn) {
    return;
  }

  try {
    updateSettingsFn(guildId, {
      muted: true,
      suppress_everyone: true,
      suppress_roles: true,
    });
    mutedGuildCount += 1;
    console.log(`[Nekocord/MuteNewGuild] Muted newly joined server ${guildId}`);
  } catch (err) {
    console.error('[Nekocord/MuteNewGuild] Failed to mute new server:', err);
  }
}

export default definePlugin({
  start() {
    startedAt = Date.now();
    knownGuildIds.clear();
    seedKnownGuilds();

    const existing = findByProps('updateGuildNotificationSettings');
    if (typeof existing?.updateGuildNotificationSettings === 'function') {
      updateSettingsFn = existing.updateGuildNotificationSettings.bind(existing);
    } else {
      cancelWatch = watchNamedExports(NOTIF_TARGET_NAMES, (hit) => {
        if (!updateSettingsFn && typeof hit.target[hit.key] === 'function') {
          updateSettingsFn = hit.target[hit.key].bind(hit.target);
        }
      });
    }

    cancelDispatcherWait = onFluxDispatcher((dispatcher) => {
      if (!activeDispatcher) {
        activeDispatcher = dispatcher;
        dispatcher.subscribe('GUILD_CREATE', handleGuildCreate);
      }
    });
  },

  stop() {
    if (cancelDispatcherWait) {
      cancelDispatcherWait();
      cancelDispatcherWait = null;
    }
    if (cancelWatch) {
      cancelWatch();
      cancelWatch = null;
    }
    if (activeDispatcher) {
      activeDispatcher.unsubscribe('GUILD_CREATE', handleGuildCreate);
      activeDispatcher = null;
    }
    updateSettingsFn = null;
    knownGuildIds.clear();
  },
});
