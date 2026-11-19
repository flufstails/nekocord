import { createRowPlugin, snowflakeToEpochMs, pad2 } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      const ms = snowflakeToEpochMs(msg.id);
      if (ms == null) {
        return false;
      }
      const d = new Date(ms);
      const next = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
      if (msg.timestamp !== next) {
        msg.timestamp = next;
        return true;
      }
      return false;
    });
