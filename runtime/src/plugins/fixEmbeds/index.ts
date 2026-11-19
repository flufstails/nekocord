import { patchOutgoingMessageContent, transformOutsideCode } from '../../utils/text.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const URL_RE = /https?:\/\/[^\s<>]+/gi;
const TRAILING_PUNCT_RE = /[.,!?;:)\]}'"]+$/;

const settings = definePluginSettings({
  twitterHost: {
    type: OptionType.SELECT,
    label: 'Twitter / X Mirror',
    description: 'Embed-friendly domain used to rewrite twitter.com and x.com status links.',
    default: 'fxtwitter.com',
    options: [
      { label: 'fxtwitter.com', value: 'fxtwitter.com' },
      { label: 'vxtwitter.com', value: 'vxtwitter.com' },
      { label: 'fixupx.com', value: 'fixupx.com' },
    ],
  },
  redditHost: {
    type: OptionType.SELECT,
    label: 'Reddit Mirror',
    description: 'Embed-friendly domain used to rewrite Reddit post and short links.',
    default: 'rxddit.com',
    options: [
      { label: 'rxddit.com', value: 'rxddit.com' },
      { label: 'vxreddit.com', value: 'vxreddit.com' },
    ],
  },
  tiktokHost: {
    type: OptionType.SELECT,
    label: 'TikTok Mirror',
    description: 'Embed-friendly base domain used to rewrite TikTok links.',
    default: 'vxtiktok.com',
    options: [
      { label: 'vxtiktok.com', value: 'vxtiktok.com' },
      { label: 'tnktok.com', value: 'tnktok.com' },
    ],
  },
  instagramHost: {
    type: OptionType.SELECT,
    label: 'Instagram Mirror',
    description: 'Embed-friendly domain used to rewrite Instagram posts and reels.',
    default: 'kkinstagram.com',
    options: [
      { label: 'kkinstagram.com', value: 'kkinstagram.com' },
      { label: 'ddinstagram.com', value: 'ddinstagram.com' },
    ],
  },
});

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
    nextHost = settings.store.twitterHost;
  } else if (host === 'vm.tiktok.com') {
    nextHost = `vm.${settings.store.tiktokHost}`;
  } else if (host === 'vt.tiktok.com') {
    nextHost = `vt.${settings.store.tiktokHost}`;
  } else if (host === 'tiktok.com' || host === 'www.tiktok.com') {
    nextHost = settings.store.tiktokHost;
  } else if (
    (host === 'instagram.com' || host === 'www.instagram.com') &&
    (/^\/(?:p|reel|reels)\//i.test(pathOnly) || pathOnly.includes('/reel/') || pathOnly.includes('/p/'))
  ) {
    nextHost = settings.store.instagramHost;
  } else if (
    (host === 'reddit.com' || host === 'www.reddit.com' || host === 'old.reddit.com') &&
    (pathOnly.includes('/comments/') || pathOnly.includes('/s/'))
  ) {
    nextHost = settings.store.redditHost;
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
  settings,
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
