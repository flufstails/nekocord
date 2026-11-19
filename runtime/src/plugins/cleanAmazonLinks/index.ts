import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
      segment.replace(
        /https?:\/\/((?:www\.)?amazon\.[a-z.]{2,6})\/(?:[^\s/]+\/)?(?:dp|gp\/product)\/([A-Z0-9]{10})[^\s>]*/gi,
        'https://$1/dp/$2',
      ));
