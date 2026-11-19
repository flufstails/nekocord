import { createUrlTransformPlugin, replaceDomain } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin(replaceDomain(/https?:\/\/(?:www\.|new\.)?reddit\.com\//gi, 'https://old.reddit.com/'));
