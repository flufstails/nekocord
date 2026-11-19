import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\/[^\s?<>]+)\?[^\s<>]+/gi, '$1'),
);
