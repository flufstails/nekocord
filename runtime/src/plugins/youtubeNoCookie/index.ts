import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
      segment
        .replace(
          /https?:\/\/(?:www\.|m\.)?youtube\.com\/watch\?[^\s]*v=([A-Za-z0-9_-]+)[^\s]*/gi,
          'https://www.youtube-nocookie.com/embed/$1',
        )
        .replace(/https?:\/\/youtu\.be\/([A-Za-z0-9_-]+)/gi, 'https://www.youtube-nocookie.com/embed/$1'));
