import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/(?:www\.|m\.|clips\.)?twitch\.tv\/[^\s?<>]+)\?[^\s<>]+/gi, '$1'),
);
