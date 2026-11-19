import { registerMessageRowTransformer } from '../../chat/rows.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  use24Hour: {
    type: OptionType.BOOLEAN,
    label: 'Use 24-Hour Format',
    description: 'Display timestamps in 24-hour clock format instead of 12-hour AM/PM.',
    default: true,
  },
  showSeconds: {
    type: OptionType.BOOLEAN,
    label: 'Include Seconds',
    description: 'Include seconds precision in formatted chat timestamps.',
    default: true,
  },
});

const DISCORD_EPOCH = 1420070400000;
const SNOWFLAKE_DIVISOR = 4194304; // 2^22
const SNOWFLAKE_RE = /^\d{15,22}$/;
const HAS_FULL_RE = /^\d{4}-\d{2}-\d{2} /;

let unregisterRowTransformer: (() => void) | null = null;
let formattedCount = 0;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Decodes a Discord snowflake ID into Unix epoch milliseconds using exact decimal
 * long division to avoid BigInt runtime dependencies on Hermes.
 */
function snowflakeToMs(id: string): number | null {
  if (!SNOWFLAKE_RE.test(id)) {
    return null;
  }
  let quotient = 0;
  let remainder = 0;
  for (let i = 0; i < id.length; i += 1) {
    const current = remainder * 10 + (id.charCodeAt(i) - 48);
    const digit = Math.floor(current / SNOWFLAKE_DIVISOR);
    remainder = current % SNOWFLAKE_DIVISOR;
    quotient = quotient * 10 + digit;
  }
  const ms = quotient + DISCORD_EPOCH;
  return Number.isFinite(ms) ? ms : null;
}

function formatFullTimestamp(ms: number): string {
  const d = new Date(ms);
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const rawH = d.getHours();
  const minutes = pad2(d.getMinutes());
  const secPart = settings.store.showSeconds ? `:${pad2(d.getSeconds())}` : '';
  if (settings.store.use24Hour) {
    return `${year}-${month}-${day} ${pad2(rawH)}:${minutes}${secPart}`;
  }
  const period = rawH >= 12 ? 'PM' : 'AM';
  const h12 = rawH % 12 || 12;
  return `${year}-${month}-${day} ${h12}:${minutes}${secPart} ${period}`;
}

export default definePlugin({
  settings,
  start() {
    unregisterRowTransformer = registerMessageRowTransformer((row) => {
      const msg = row.message;
      if (
        !msg ||
        typeof msg !== 'object' ||
        typeof msg.timestamp !== 'string' ||
        !msg.timestamp ||
        typeof msg.id !== 'string' ||
        HAS_FULL_RE.test(msg.timestamp)
      ) {
        return false;
      }

      const ms = snowflakeToMs(msg.id);
      if (ms === null) {
        return false;
      }

      msg.timestamp = formatFullTimestamp(ms);
      formattedCount += 1;
      return true;
    });
  },

  stop() {
    if (unregisterRowTransformer) {
      unregisterRowTransformer();
      unregisterRowTransformer = null;
    }
  },
});
