import { createUrlTransformPlugin, replaceDomain } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin(
  replaceDomain(/https?:\/\/(?:www\.|m\.)?bilibili\.com\/video\//gi, 'https://www.vxbilibili.com/video/'),
);
