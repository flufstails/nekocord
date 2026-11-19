import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/https?:\/\/[^\s<>]+/gi, (raw) => {
    const q = raw.indexOf('?');
    if (q < 0) return raw;
    const base = raw.slice(0, q);
    const params = raw
      .slice(q + 1)
      .split('&')
      .filter((p) => !/^(?:fbclid|mibextid|fs)=/i.test(p));
    return params.length > 0 ? `${base}?${params.join('&')}` : base;
  }),
);
