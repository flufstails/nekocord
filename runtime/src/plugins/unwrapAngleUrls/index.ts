import { createUrlTransformPlugin } from '../_shared/linkAndEmbed.js';

export default createUrlTransformPlugin((segment) => segment.replace(/<(https?:\/\/[^\s<>]+)>/gi, '$1'));
