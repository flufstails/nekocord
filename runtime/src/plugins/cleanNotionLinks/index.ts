import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/(?:www\.)?notion\.(?:so|site)\/[^\s?<>]+)\?pvs=[^\s&#<>]+/gi, '$1'),
);
