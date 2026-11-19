import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/(?:www\.)?shopee\.[a-z.]{2,6}\/[^\s?<>]+)\?[^\s<>]+/gi, '$1'),
);
