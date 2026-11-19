import { createUrlTransformPlugin, replaceDomain } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin(replaceDomain(/https?:\/\/(?:www\.)?pixiv\.net\//gi, 'https://phixiv.net/'));
