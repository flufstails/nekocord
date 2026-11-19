import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/music\.apple\.com\/[^\s?<>]+)\?[^\s<>]+/gi, '$1'),
);
