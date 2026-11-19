import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/(?:[a-z0-9-]+\.)?medium\.com\/[^\s?<>]+)\?[^\s<>]+/gi, '$1'),
);
