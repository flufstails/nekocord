import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
      segment.replace(
        /https?:\/\/(?:www\.|m\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]+)[^\s]*/gi,
        'https://www.youtube.com/watch?v=$1',
      ));
