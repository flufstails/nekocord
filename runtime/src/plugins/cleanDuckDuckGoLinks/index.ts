import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/https?:\/\/(?:www\.)?duckduckgo\.com\/l\/\?[^\s<>]+/gi, (raw) => {
    const m = /[?&]uddg=([^&]+)/i.exec(raw);
    if (!m) return raw;
    try {
      const target = decodeURIComponent(m[1]);
      return /^https?:\/\//i.test(target) ? target : raw;
    } catch {
      return raw;
    }
  }),
);
