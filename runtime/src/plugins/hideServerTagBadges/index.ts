import { clearProp, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  const a = clearProp(msg, 'clanTag');
  const b = clearProp(msg, 'clan');
  const c = clearProp(msg, 'primaryGuild');
  return a || b || c;
});
