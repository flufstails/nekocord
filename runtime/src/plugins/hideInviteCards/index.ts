import { clearProp, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  const a = clearProp(msg, 'codedLinks');
  let b = false;
  if (Array.isArray(msg.embeds)) {
    const kept = msg.embeds.filter((e: any) => e?.type !== 'invite');
    if (kept.length !== msg.embeds.length) {
      msg.embeds = kept;
      b = true;
    }
  }
  return a || b;
});
