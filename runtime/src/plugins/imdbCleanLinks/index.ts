import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/(?:www\.|m\.)?imdb\.com\/(?:title|name)\/[a-z0-9]+\/?)\?[^\s<>]+/gi, '$1'),
);
