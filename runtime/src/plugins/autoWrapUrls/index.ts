import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
      segment.replace(/(^|\s)(https?:\/\/[^\s<>]+)(?=\s|$)/gi, '$1<$2>'));
