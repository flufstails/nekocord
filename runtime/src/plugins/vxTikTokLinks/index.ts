import { createUrlTransformPlugin, replaceDomain } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin(replaceDomain(/https?:\/\/(?:www\.|vm\.|vt\.)?tiktok\.com\//gi, 'https://vxtiktok.com/'));
