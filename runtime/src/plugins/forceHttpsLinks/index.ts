import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
      segment.replace(/\bhttp:\/\/(?!(?:localhost|127\.0\.0\.1|10\.|192\.168\.))([^\s>]+)/gi, 'https://$1'));
