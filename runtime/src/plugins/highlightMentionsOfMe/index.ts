import { getUserStore } from '../../metro/common.js';
import { createRowPlugin, extractMessageText, ROW_COLOURS } from '../_shared/chatDisplay.js';

export default createRowPlugin((row, msg) => {
  if (row.backgroundHighlight) return false;
  const me = getUserStore()?.getCurrentUser?.();
  const id = me?.id ? String(me.id) : '';
  const text = extractMessageText(msg);
  const direct =
    (Boolean(id) && (text.indexOf(`<@${id}>`) !== -1 || text.indexOf(`<@!${id}>`) !== -1)) ||
    (Array.isArray(msg.mentions) && id && msg.mentions.some((m: any) => String(m?.id) === id));
  if (direct) {
    row.backgroundHighlight = {
      backgroundColor: ROW_COLOURS.amberBg,
      gutterColor: ROW_COLOURS.amberGutter,
    };
    return true;
  }
  return false;
});
