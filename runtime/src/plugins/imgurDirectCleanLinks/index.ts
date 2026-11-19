import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/(?:i\.|www\.)?imgur\.com\/[^\s?<>]+)\?[^\s<>]+/gi, '$1'),
);
