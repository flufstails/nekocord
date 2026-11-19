import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/(?:www\.)?tenor\.com\/view\/[^\s?<>]+)\?[^\s<>]+/gi, '$1'),
);
