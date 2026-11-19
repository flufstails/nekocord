import { registerMessageRowTransformer } from '../../chat/rows.js';
import { onFluxDispatcher, type FluxDispatcher } from '../../metro/common.js';
import { definePlugin } from '../types.js';
import { appendTimestampNote, snowflakeToEpochMs } from '../_shared/chatDisplay.js';

let cancelDisp: (() => void) | null = null;
let unregisterRow: (() => void) | null = null;
let dispatcherRef: FluxDispatcher | null = null;
const latencyNotes = new Map<string, string>();

function onMessageCreate(action: Record<string, any>) {
  const m = action?.message;
  if (!m?.id) return;
  const createdMs = snowflakeToEpochMs(String(m.id));
  if (createdMs === null) return;
  const deltaMs = Date.now() - createdMs;
  if (deltaMs >= 1500 && deltaMs < 3600_000) {
    const secs = (deltaMs / 1000).toFixed(1);
    if (latencyNotes.size > 200) {
      const oldest = latencyNotes.keys().next().value;
      if (oldest) latencyNotes.delete(oldest);
    }
    latencyNotes.set(String(m.id), `[+${secs}s]`);
  }
}

export default definePlugin({
  start() {
    cancelDisp = onFluxDispatcher((dispatcher) => {
      if (!dispatcherRef) {
        dispatcherRef = dispatcher;
        dispatcher.subscribe('MESSAGE_CREATE', onMessageCreate);
      }
    });
    unregisterRow = registerMessageRowTransformer((row) => {
      const msg = row.message;
      if (!msg?.id) return false;
      const note = latencyNotes.get(String(msg.id));
      return note ? appendTimestampNote(msg, note) : false;
    });
  },
  stop() {
    cancelDisp?.();
    cancelDisp = null;
    if (dispatcherRef) {
      dispatcherRef.unsubscribe('MESSAGE_CREATE', onMessageCreate);
      dispatcherRef = null;
    }
    unregisterRow?.();
    unregisterRow = null;
    latencyNotes.clear();
  },
});
