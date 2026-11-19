import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/https?:\/\/(?:www\.|m\.)?bilibili\.com\/[^\s<>]+/gi, (raw) => {
    const q = raw.indexOf('?');
    if (q < 0) return raw;
    const base = raw.slice(0, q);
    const keep = raw
      .slice(q + 1)
      .split('&')
      .filter((p) => !/^(?:spm_id_from|vd_source|buvid|from_spmid|share_source|share_medium)=/i.test(p));
    return keep.length > 0 ? `${base}?${keep.join('&')}` : base;
  }),
);
