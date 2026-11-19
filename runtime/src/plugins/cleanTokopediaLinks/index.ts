import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/(?:www\.|m\.)?tokopedia\.com\/[^\s?<>]+)\?[^\s<>]+/gi, '$1'),
);
