import { createUrlTransformPlugin, replaceDomain } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin(replaceDomain(/https?:\/\/(?:www\.)?threads\.(?:net|com)\//gi, 'https://vxthreads.net/'));
