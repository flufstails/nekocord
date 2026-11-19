import { waitForStore } from '../../metro/index.js';
import { after, instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let cancelWait: (() => void) | null = null;
const unpatches: Unpatch[] = [];

export default definePlugin({
  start() {
    cancelWait = waitForStore('SpotifyStore', (store) => {
      if (unpatches.length > 0) return;
      if (typeof store.getActiveSocketAndDevice === 'function') {
        try {
          unpatches.push(
            after(store, 'getActiveSocketAndDevice', (_args, res: any) => {
              if (res?.socket && !res.socket.isPremium) {
                return { ...res, socket: { ...res.socket, isPremium: true } };
              }
              return res;
            }),
          );
        } catch {
          // Ignore locked SpotifyStore methods.
        }
      }
      if (typeof store.canPlaySpotify === 'function') {
        try {
          unpatches.push(instead(store, 'canPlaySpotify', () => true));
        } catch {
          // Ignore locked SpotifyStore methods.
        }
      }
    });
  },
  stop() {
    cancelWait?.();
    cancelWait = null;
    while (unpatches.length > 0) unpatches.pop()?.();
  },
});
