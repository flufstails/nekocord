import { createUrlTransformPlugin, replaceDomain } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin(
  replaceDomain(/https?:\/\/(?:www\.)?google\.[a-z.]+\/search\?/gi, 'https://duckduckgo.com/?'),
);
