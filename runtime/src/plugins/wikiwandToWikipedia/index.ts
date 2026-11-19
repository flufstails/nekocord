import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(
    /https?:\/\/(?:www\.)?wikiwand\.com\/([a-z]{2,3})\/(?:articles\/)?([^\s<>]+)/gi,
    'https://$1.wikipedia.org/wiki/$2',
  ),
);
