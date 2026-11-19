import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
      segment.replace(
        /https?:\/\/([a-z0-9-]+)\.fandom\.com\/wiki\/([^\s>]*)/gi,
        'https://breezewiki.com/$1/wiki/$2',
      ));
