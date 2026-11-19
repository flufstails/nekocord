import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/(?:www\.|media\.)?giphy\.com\/[^\s?<>]+)\?[^\s<>]+/gi, '$1'),
);
