import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!Array.isArray(msg.embeds) || msg.embeds.length === 0) return false;
  const filtered = msg.embeds.filter(
    (e: any) =>
      e &&
      (e.title ||
        e.description ||
        e.url ||
        e.image ||
        e.thumbnail ||
        e.video ||
        (Array.isArray(e.fields) && e.fields.length > 0)),
  );
  if (filtered.length !== msg.embeds.length) {
    msg.embeds = filtered;
    return true;
  }
  return false;
});
