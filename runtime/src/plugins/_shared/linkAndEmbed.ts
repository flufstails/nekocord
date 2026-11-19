import { patchOutgoingMessageContent, transformOutsideCode } from '../../utils/text.js';
import { definePlugin, type PluginImplementation } from '../types.js';

export function replaceDomain(pattern: RegExp, target: string): (segment: string) => string {
  return (segment: string) => segment.replace(pattern, target);
}

export function createUrlTransformPlugin(
  transformSegment: (segment: string) => string,
): PluginImplementation {
  let unpatch: (() => void) | null = null;

  return definePlugin({
    start() {
      if (unpatch) {
        return;
      }
      unpatch = patchOutgoingMessageContent((content) => {
        if (!content || (!content.includes('http://') && !content.includes('https://'))) {
          return content;
        }
        return transformOutsideCode(content, (segment) => transformSegment(segment));
      });
    },

    stop() {
      if (unpatch) {
        unpatch();
        unpatch = null;
      }
    },
  });
}
