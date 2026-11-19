import {
  appendTimestampNote,
  createRowPlugin,
  pad2,
  snowflakeToEpochMs,
} from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (typeof msg.timestamp !== 'string' || /\b20\d{2}-\d{2}-\d{2}\b/.test(msg.timestamp)) {
    return false;
  }
  const ms = snowflakeToEpochMs(msg.id);
  if (ms === null) return false;
  const d = new Date(ms);
  const dateTag = `(${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())})`;
  return appendTimestampNote(msg, dateTag);
});
