import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/https?:\/\/(?:www\.)?discord\.gg\/([A-Za-z0-9-]+)/gi, 'https://discord.com/invite/$1'),
);
