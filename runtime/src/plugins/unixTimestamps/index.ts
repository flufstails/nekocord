import { createRowPlugin, snowflakeToEpochMs } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      const ms = snowflakeToEpochMs(msg.id);
      if (ms == null) {
        return false;
      }
      const unix = Math.floor(ms / 1000);
      const suffix = `[${unix}]`;
      const current = typeof msg.timestamp === 'string' ? msg.timestamp : '';
      if (current.includes(suffix)) {
        return false;
      }
      msg.timestamp = current ? `${current} ${suffix}` : suffix;
      return true;
    });
