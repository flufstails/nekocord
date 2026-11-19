import { createRowPlugin, pad2, snowflakeToEpochMs } from '../_shared/chatDisplay.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  preset: {
    type: OptionType.SELECT,
    label: 'Timestamp Style',
    description: 'Choose how decoded message timestamps are displayed in chat rows.',
    options: [
      { label: 'ISO Date (YYYY-MM-DD HH:mm)', value: 'iso', default: true },
      { label: '24h Time Only (HH:mm)', value: 'military' },
      { label: 'Compact Date (MM/DD HH:mm)', value: 'compact-date' },
    ],
    default: 'iso',
  },
  showSeconds: {
    type: OptionType.BOOLEAN,
    label: 'Show Seconds',
    description: 'Append seconds (:ss) to every custom formatted timestamp.',
    default: true,
  },
});

const inner = createRowPlugin((_row, msg) => {
  if (typeof msg.id !== 'string' || typeof msg.timestamp !== 'string' || !msg.timestamp) {
    return false;
  }
  const ms = snowflakeToEpochMs(msg.id);
  if (ms === null) {
    return false;
  }
  const d = new Date(ms);
  const year = d.getFullYear();
  const month = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  const sec = settings.store.showSeconds ? `:${pad2(d.getSeconds())}` : '';

  let next = `${year}-${month}-${day} ${hh}:${mm}${sec}`;
  if (settings.store.preset === 'military') {
    next = `${hh}:${mm}${sec}`;
  } else if (settings.store.preset === 'compact-date') {
    next = `${month}/${day} ${hh}:${mm}${sec}`;
  }

  if (msg.timestamp === next) {
    return false;
  }
  msg.timestamp = next;
  return true;
});

export default definePlugin({
  ...inner,
  settings,
});
