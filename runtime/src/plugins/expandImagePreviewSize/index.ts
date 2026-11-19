import { createRowPlugin } from '../_shared/chatDisplay.js';

function bumpCdnSize(url: string): string {
  if (typeof url !== 'string' || url.indexOf('discordapp') === -1) return url;
  return url.replace(/([?&])(width|height)=\d+/gi, '$1$2=2048');
}

export default createRowPlugin((_row, msg) => {
  let changed = false;
  if (Array.isArray(msg.attachments)) {
    for (let i = 0; i < msg.attachments.length; i += 1) {
      const att = msg.attachments[i];
      if (att && typeof att.proxy_url === 'string') {
        const next = bumpCdnSize(att.proxy_url);
        if (next !== att.proxy_url) {
          att.proxy_url = next;
          changed = true;
        }
      }
    }
  }
  return changed;
});
