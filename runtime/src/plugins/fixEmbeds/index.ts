import { patchOutgoingMessageContent, transformOutsideCode } from '../../utils/text.js';
import { definePlugin } from '../types.js';

const URL_RE = /https?:\/\/[^\s<>]+/gi;
const TRAILING_PUNCT_RE = /[.,!?;:)\]}'"]+$/;

let rewrittenCount = 0;
let unpatchContent: (() => void) | null = null;

function rewriteEmbedHost(urlStr: string): string {
  const match = urlStr.match(/^(https?:\/\/)([^/?#]+)(.*)$/i);
  if (!match) {
    return urlStr;
  }
  const scheme = match[1];
  const host = match[2].toLowerCase();
  const rest = match[3];
  const pathOnly = rest.split(/[?#]/)[0];

  let nextHost: string | null = null;

  if (
    (host === 'twitter.com' ||
      host === 'www.twitter.com' ||
      host === 'mobile.twitter.com' ||
      host === 'x.com' ||
      host === 'www.x.com' ||
      host === 'mobile.x.com') &&
    pathOnly.includes('/status/')
  ) {
    nextHost = 'fxtwitter.com';
  } else if (host === 'vm.tiktok.com') {
    nextHost = 'vm.vxtiktok.com';
  } else if (host === 'vt.tiktok.com') {
    nextHost = 'vt.vxtiktok.com';
  } else if (host === 'tiktok.com' || host === 'www.tiktok.com') {
    nextHost = 'vxtiktok.com';
  } else if (
    (host === 'instagram.com' || host === 'www.instagram.com') &&
    (/^\/(?:p|reel|reels)\//i.test(pathOnly) || pathOnly.includes('/reel/') || pathOnly.includes('/p/'))
  ) {
    nextHost = 'kkinstagram.com';
  } else if (
    (host === 'reddit.com' || host === 'www.reddit.com' || host === 'old.reddit.com') &&
    (pathOnly.includes('/comments/') || pathOnly.includes('/s/'))
  ) {
    nextHost = 'rxddit.com';
  } else if (host === 'bsky.app' && /^\/profile\/[^/]+\/post\//i.test(pathOnly)) {
    nextHost = 'bskx.app';
  }

  return nextHost ? `${scheme}${nextHost}${rest}` : urlStr;
}

function rewriteEmbedsInContent(content: string): string {
  if (!content.includes('http')) {
    return content;
  }
  return transformOutsideCode(content, (segment) =>
    segment.replace(URL_RE, (matched, offset: number) => {
      if (
        offset > 0 &&
        segment[offset - 1] === '<' &&
        segment[offset + matched.length] === '>'
      ) {
        return matched;
      }
      const punctMatch = matched.match(TRAILING_PUNCT_RE);
      const trailing = punctMatch ? punctMatch[0] : '';
      const core = trailing ? matched.slice(0, -trailing.length) : matched;
      const rewritten = rewriteEmbedHost(core);
      if (rewritten !== core) {
        rewrittenCount += 1;
        return `${rewritten}${trailing}`;
      }
      return matched;
    }),
  );
}

/**
 * Returns the number of social links rewritten for better Discord embeds.
 */
export function getRewrittenEmbedCount(): number {
  return rewrittenCount;
}

export default definePlugin({
  start() {
    if (!unpatchContent) {
      unpatchContent = patchOutgoingMessageContent(rewriteEmbedsInContent);
    }
  },

  stop() {
    if (unpatchContent) {
      unpatchContent();
      unpatchContent = null;
    }
  },
});
