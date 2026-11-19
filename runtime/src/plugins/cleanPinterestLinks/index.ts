import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/(?:[a-z0-9-]+\.)?pinterest\.[a-z.]{2,6}\/[^\s?<>]+)\?[^\s<>]+/gi, '$1'),
);
