import { createUrlTransformPlugin, replaceDomain } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin(replaceDomain(/https?:\/\/(?:www\.|old\.|new\.)?reddit\.com\//gi, 'https://redlib.perennialte.ch/'));
