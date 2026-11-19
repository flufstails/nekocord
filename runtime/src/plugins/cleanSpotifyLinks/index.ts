import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
      segment.replace(
        /(https?:\/\/open\.spotify\.com\/[A-Za-z0-9/_-]+)\?[^\s>]+/gi,
        '$1',
      ));
