import { appendTimestampNote, createRowPlugin, pad2, snowflakeToEpochMs } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!msg.id) return false;
  const cur = typeof msg.timestamp === 'string' ? msg.timestamp : '';
  if (/\d{2}:\d{2}:\d{2}/.test(cur)) return false;
  const ms = snowflakeToEpochMs(String(msg.id));
  if (ms === null) return false;
  const d = new Date(ms);
  const exact = `(${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())})`;
  return appendTimestampNote(msg, exact);
});
