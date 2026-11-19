import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/store\.steampowered\.com\/app\/\d+(?:\/[^\s?<>]*)?)\?[^\s<>]+/gi, '$1'),
);
