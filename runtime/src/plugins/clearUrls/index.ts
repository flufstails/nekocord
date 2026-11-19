import { patchOutgoingMessageContent, transformOutsideCode } from '../../utils/text.js';
import { definePlugin } from '../types.js';

const URL_RE = /https?:\/\/[^\s<>]+/gi;
const TRAILING_PUNCT_RE = /[.,!?;:)\]}'"]+$/;

const GLOBAL_TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_cid',
  'utm_reader',
  'utm_name',
  'utm_social',
  'utm_social-type',
  'fbclid',
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'yclid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'igsh',
  'si',
  'pp',
  'ref_src',
  'ref_url',
  'spm',
  'scid',
  'vero_id',
  '_hsenc',
  '_hsmi',
  'mkt_tok',
  'oly_anon_id',
  'oly_enc_id',
  'rb_clickid',
  'wickedid',
  'twclid',
  'tt_medium',
  'tt_content',
  'share_id',
  'sender_device',
  'is_from_webapp',
]);

const HOST_TRACKING_PARAMS: Record<string, Set<string>> = {
  'twitter.com': new Set(['s', 't']),
  'www.twitter.com': new Set(['s', 't']),
  'mobile.twitter.com': new Set(['s', 't']),
  'x.com': new Set(['s', 't']),
  'www.x.com': new Set(['s', 't']),
  'mobile.x.com': new Set(['s', 't']),
  'youtube.com': new Set(['feature']),
  'www.youtube.com': new Set(['feature']),
  'm.youtube.com': new Set(['feature']),
  'youtu.be': new Set(['feature']),
};

let cleanedUrlCount = 0;
let unpatchContent: (() => void) | null = null;

function extractHost(urlWithoutHashAndQuery: string): string {
  const afterScheme = urlWithoutHashAndQuery.replace(/^https?:\/\//i, '');
  const slashIdx = afterScheme.indexOf('/');
  const authority = slashIdx >= 0 ? afterScheme.slice(0, slashIdx) : afterScheme;
  const atIdx = authority.lastIndexOf('@');
  const hostPort = atIdx >= 0 ? authority.slice(atIdx + 1) : authority;
  const colonIdx = hostPort.indexOf(':');
  return (colonIdx >= 0 ? hostPort.slice(0, colonIdx) : hostPort).toLowerCase();
}

function cleanSingleUrl(rawUrl: string): string {
  const hashIdx = rawUrl.indexOf('#');
  const hash = hashIdx >= 0 ? rawUrl.slice(hashIdx) : '';
  const withoutHash = hashIdx >= 0 ? rawUrl.slice(0, hashIdx) : rawUrl;

  const queryIdx = withoutHash.indexOf('?');
  if (queryIdx < 0) {
    return rawUrl;
  }

  const base = withoutHash.slice(0, queryIdx);
  const queryStr = withoutHash.slice(queryIdx + 1);
  if (!queryStr) {
    return rawUrl;
  }

  const host = extractHost(base);
  const hostParams = HOST_TRACKING_PARAMS[host];

  const kept: string[] = [];
  let removed = false;
  for (const part of queryStr.split('&')) {
    if (!part) {
      continue;
    }
    const eqIdx = part.indexOf('=');
    const rawKey = eqIdx >= 0 ? part.slice(0, eqIdx) : part;
    let key: string;
    try {
      key = decodeURIComponent(rawKey).toLowerCase();
    } catch {
      key = rawKey.toLowerCase();
    }

    if (GLOBAL_TRACKING_PARAMS.has(key) || hostParams?.has(key)) {
      removed = true;
      continue;
    }
    kept.push(part);
  }

  if (!removed) {
    return rawUrl;
  }

  const nextQuery = kept.length > 0 ? `?${kept.join('&')}` : '';
  return `${base}${nextQuery}${hash}`;
}

function cleanContentUrls(content: string): string {
  if (!content.includes('http')) {
    return content;
  }
  return transformOutsideCode(content, (segment) =>
    segment.replace(URL_RE, (matched) => {
      const punctMatch = matched.match(TRAILING_PUNCT_RE);
      const trailing = punctMatch ? punctMatch[0] : '';
      const core = trailing ? matched.slice(0, -trailing.length) : matched;
      const cleaned = cleanSingleUrl(core);
      if (cleaned !== core) {
        cleanedUrlCount += 1;
        return `${cleaned}${trailing}`;
      }
      return matched;
    }),
  );
}

/**
 * Returns the number of outgoing URLs stripped of tracking parameters.
 */
export function getCleanedUrlCount(): number {
  return cleanedUrlCount;
}

export default definePlugin({
  start() {
    if (!unpatchContent) {
      unpatchContent = patchOutgoingMessageContent(cleanContentUrls);
    }
  },

  stop() {
    if (unpatchContent) {
      unpatchContent();
      unpatchContent = null;
    }
  },
});
