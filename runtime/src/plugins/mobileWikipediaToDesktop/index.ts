import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/https?:\/\/([a-z-]+)\.m\.wikipedia\.org\//gi, 'https://$1.wikipedia.org/'),
);
