import { createUrlTransformPlugin, replaceDomain } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin(replaceDomain(/https?:\/\/(?:www\.|mobile\.)?(?:twitter|x)\.com\//gi, 'https://xcancel.com/'));
