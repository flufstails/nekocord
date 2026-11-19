import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/https?:\/\/(?:docs|drive)\.google\.com\/[^\s<>]+/gi, (raw) => {
    const q = raw.indexOf('?');
    if (q < 0) return raw;
    const base = raw.slice(0, q);
    const keep = raw
      .slice(q + 1)
      .split('&')
      .filter((p) => !/^usp=/i.test(p));
    return keep.length > 0 ? `${base}?${keep.join('&')}` : base;
  }),
);
