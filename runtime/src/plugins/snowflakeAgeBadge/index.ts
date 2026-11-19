import {
  appendTimestampNote,
  createRowPlugin,
  snowflakeToEpochMs,
} from '../_shared/chatDisplay.js';

function formatAge(msDiff: number): string {
  const sec = Math.max(0, Math.floor(msDiff / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default createRowPlugin((_row, msg) => {
  const ts = snowflakeToEpochMs(msg.id);
  if (ts === null) return false;
  return appendTimestampNote(msg, `(${formatAge(Date.now() - ts)})`);
});
