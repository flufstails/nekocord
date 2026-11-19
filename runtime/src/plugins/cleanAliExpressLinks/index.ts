import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
      segment.replace(
        /(https?:\/\/(?:[a-z]+\.)?aliexpress\.com\/item\/\d+\.html)\?[^\s>]+/gi,
        '$1',
      ));
