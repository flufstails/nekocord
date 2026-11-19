import { createRowPlugin, pad2, snowflakeToEpochMs } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  const refMsg = msg.referencedMessage?.message;
  if (!refMsg || typeof refMsg !== 'object' || !refMsg.id) {
    return false;
  }
  const ms = snowflakeToEpochMs(String(refMsg.id));
  if (ms === null) {
    return false;
  }
  const d = new Date(ms);
  const tag = `[${pad2(d.getHours())}:${pad2(d.getMinutes())}]`;
  if (typeof refMsg.timestamp === 'string' && refMsg.timestamp) {
    if (refMsg.timestamp.includes(tag)) return false;
    refMsg.timestamp = `${refMsg.timestamp} ${tag}`;
    return true;
  }
  if (typeof refMsg.username === 'string' && refMsg.username) {
    if (refMsg.username.includes(tag)) return false;
    refMsg.username = `${refMsg.username} ${tag}`;
    return true;
  }
  return false;
});
