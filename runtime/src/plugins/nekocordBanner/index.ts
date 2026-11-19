import { isChatRowHookReady } from '../../chat/rows.js';
import {
  getChannelStore,
  getMessageActions,
  getMessageStore,
  getRelationshipStore,
  getStore,
  getThemeStore,
  getUserStore,
  onFluxDispatcher,
} from '../../metro/common.js';
import { getMetroStats } from '../../metro/index.js';
import { definePlugin } from '../types.js';

let cancelDispatcherWait: (() => void) | null = null;
let diagTimer: number | null = null;

export default definePlugin({
  start() {
    const stats = getMetroStats();
    console.log(
      `[Nekocord] Runtime v1.0.0 started (preloadHook=${stats.hookedPreload}, factories=${stats.factories}, initialized=${stats.initialized})`,
    );

    cancelDispatcherWait = onFluxDispatcher((dispatcher) => {
      console.log(
        `[Nekocord] Located Flux-like dispatcher (${Object.keys(dispatcher).slice(0, 6).join(', ')})`,
      );
      if (diagTimer === null) {
        diagTimer = setTimeout(() => {
          diagTimer = null;
          const resolved: string[] = [];
          if (getMessageStore()) resolved.push('MessageStore');
          if (getUserStore()) resolved.push('UserStore');
          if (getChannelStore()) resolved.push('ChannelStore');
          if (getThemeStore()) resolved.push('ThemeStore');
          if (getRelationshipStore()) resolved.push('RelationshipStore');
          if (getStore('DeveloperOptionsStore')) resolved.push('DeveloperOptionsStore');
          const msgActionsReady = Boolean(getMessageActions());
          const chatHook = isChatRowHookReady();
          console.log(
            `[Nekocord] Diagnostics: stores=[${resolved.join(', ')}] messageActions=${msgActionsReady} chatHook=${chatHook}`,
          );
        }, 1500);
      }
    });
  },

  stop() {
    if (cancelDispatcherWait) {
      cancelDispatcherWait();
      cancelDispatcherWait = null;
    }
    if (diagTimer !== null) {
      clearTimeout(diagTimer);
      diagTimer = null;
    }
  },
});
