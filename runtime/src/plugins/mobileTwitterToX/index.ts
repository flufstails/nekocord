import { createUrlTransformPlugin, replaceDomain } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin(
  replaceDomain(/https?:\/\/mobile\.twitter\.com\//gi, 'https://x.com/'),
);
