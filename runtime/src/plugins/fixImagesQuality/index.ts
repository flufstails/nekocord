import { createRowPlugin } from '../_shared/chatDisplay.js';

function upgradeImageUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !/^https?:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\//i.test(url)) {
    return null;
  }
  if (/([?&])quality=lossless/i.test(url)) {
    return null;
  }
  if (/([?&])quality=[^&]+/i.test(url)) {
    return url.replace(/([?&])quality=[^&]+/i, '$1quality=lossless');
  }
  return url.includes('?') ? `${url}&quality=lossless` : `${url}?quality=lossless`;
}

export default createRowPlugin((_row, msg) => {
  let changed = false;
  if (Array.isArray(msg.attachments)) {
    for (let i = 0; i < msg.attachments.length; i += 1) {
      const att = msg.attachments[i];
      if (!att || typeof att !== 'object') continue;
      for (const field of ['url', 'proxyUrl', 'proxy_url'] as const) {
        const next = upgradeImageUrl(att[field]);
        if (next) {
          att[field] = next;
          changed = true;
        }
      }
    }
  }
  if (Array.isArray(msg.embeds)) {
    for (let i = 0; i < msg.embeds.length; i += 1) {
      const emb = msg.embeds[i];
      if (!emb || typeof emb !== 'object') continue;
      for (const slot of ['image', 'thumbnail'] as const) {
        const media = emb[slot];
        if (!media || typeof media !== 'object') continue;
        for (const field of ['url', 'proxyURL', 'proxyUrl'] as const) {
          const next = upgradeImageUrl(media[field]);
          if (next) {
            media[field] = next;
            changed = true;
          }
        }
      }
    }
  }
  return changed;
});
