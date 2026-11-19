import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
      segment
        .replace(/https?:\/\/(?:www\.|m\.)?youtube\.com\//gi, 'https://yewtu.be/')
        .replace(/https?:\/\/youtu\.be\/([A-Za-z0-9_-]+)/gi, 'https://yewtu.be/watch?v=$1'));
