import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(
    /https?:\/\/((?:www\.)?ebay\.[a-z.]{2,6})\/itm\/(?:[^/\s?<>]+\/)?(\d{8,15})[^\s<>]*/gi,
    'https://$1/itm/$2',
  ),
);
