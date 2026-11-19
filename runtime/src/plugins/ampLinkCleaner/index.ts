import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) =>
  segment.replace(/(https?:\/\/[^\s<>]+?)(?:\/amp\/?|\?amp(?:=1)?)(?=\s|$|#)/gi, '$1'),
);
