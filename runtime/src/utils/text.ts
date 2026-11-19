import { onHttpClient, onMessageActions } from '../metro/common.js';
import { before, type Unpatch } from '../patcher/index.js';

const CODE_SPAN_RE = /(```[\s\S]*?```|`[^`\n]+`)/g;
const PROTECTED_TOKEN_RE =
  /(https?:\/\/\S+|<(?:a?:[^:>\s]+:\d+|@!?\d+|@&\d+|#\d+|t:\d+(?::[tTdDfFR])?)>)/g;
const PROTECTED_WITH_SHORTCODE_RE =
  /(https?:\/\/\S+|<(?:a?:[^:>\s]+:\d+|@!?\d+|@&\d+|#\d+|t:\d+(?::[tTdDfFR])?)>|:[a-zA-Z0-9_~-]{2,32}:)/g;

/**
 * Applies {@code replacer} only to text segments outside fenced or inline Markdown code spans.
 */
export function transformOutsideCode(
  content: string,
  replacer: (segment: string) => string,
): string {
  if (!content.includes('`')) {
    return replacer(content);
  }
  const parts = content.split(CODE_SPAN_RE);
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i]) {
      parts[i] = replacer(parts[i]);
    }
  }
  return parts.join('');
}

/**
 * Applies {@code replacer} only to plain prose outside code spans, URLs, mentions,
 * custom emojis, dynamic timestamps, and (by default) `:shortcode:` emoji tokens.
 */
export function transformOutsideCodeAndTokens(
  content: string,
  replacer: (plain: string) => string,
  preserveShortcodes = true,
): string {
  const tokenRe = preserveShortcodes ? PROTECTED_WITH_SHORTCODE_RE : PROTECTED_TOKEN_RE;
  return transformOutsideCode(content, (segment) => {
    const parts = segment.split(tokenRe);
    for (let i = 0; i < parts.length; i += 2) {
      if (parts[i]) {
        parts[i] = replacer(parts[i]);
      }
    }
    return parts.join('');
  });
}

type OutgoingTransform = (content: string, channelId: string) => string;

const MESSAGES_POST_RE = /^\/?channels\/([^/?]+)\/messages(?:\/[^/?]+)?(?:$|\?)/;
const outgoingTransforms = new Set<OutgoingTransform>();
let transformList: OutgoingTransform[] = [];
let hooksInstalled = false;
let cancelActionsWait: (() => void) | null = null;
let cancelHttpWait: (() => void) | null = null;
const activeUnpatches: Unpatch[] = [];
const processedObjects = new WeakSet<object>();
const downstreamTokens = new Map<string, number>();

function recordDownstreamToken(channelId: string, nonce: unknown, text: string): void {
  const now = Date.now();
  if (downstreamTokens.size > 64) {
    for (const [k, exp] of downstreamTokens) {
      if (exp < now) downstreamTokens.delete(k);
    }
    while (downstreamTokens.size > 64) {
      const oldest = downstreamTokens.keys().next().value;
      if (oldest === undefined) break;
      downstreamTokens.delete(oldest);
    }
  }
  if (nonce !== undefined && nonce !== null && nonce !== '') {
    downstreamTokens.set(`${channelId}\0n:${String(nonce)}`, now + 10000);
  }
  downstreamTokens.set(`${channelId}\0t:${text}`, now + 5000);
}

function hasRecentDownstreamToken(channelId: string, nonce: unknown, text: string, consume: boolean): boolean {
  const now = Date.now();
  if (nonce !== undefined && nonce !== null && nonce !== '') {
    const nKey = `${channelId}\0n:${String(nonce)}`;
    const exp = downstreamTokens.get(nKey);
    if (exp !== undefined) {
      if (consume) downstreamTokens.delete(nKey);
      if (exp >= now) return true;
    }
  }
  const tKey = `${channelId}\0t:${text}`;
  const tExp = downstreamTokens.get(tKey);
  if (tExp !== undefined) {
    if (consume) downstreamTokens.delete(tKey);
    if (tExp >= now) return true;
  }
  return false;
}

function runPipelineOnMessage(channelId: string, obj: Record<string, any>, isDownstream: boolean, consumeToken: boolean): void {
  if (!obj || typeof obj !== 'object' || typeof obj.content !== 'string') {
    return;
  }
  if (processedObjects.has(obj)) {
    return;
  }
  if (isDownstream && hasRecentDownstreamToken(channelId, obj.nonce, obj.content, consumeToken)) {
    processedObjects.add(obj);
    return;
  }

  let next = obj.content;
  const list = transformList;
  for (let i = 0; i < list.length; i += 1) {
    try {
      const out = list[i](next, channelId);
      if (typeof out === 'string') {
        next = out;
      }
    } catch (err) {
      console.error('[Nekocord/Text] Outgoing transform error:', err);
    }
  }

  processedObjects.add(obj);
  if (next !== obj.content) {
    obj.content = next;
  }
  if (!isDownstream || !consumeToken) {
    recordDownstreamToken(channelId, obj.nonce, next);
  }
}

function ensureOutgoingHooks(): void {
  if (hooksInstalled) {
    return;
  }
  hooksInstalled = true;

  cancelActionsWait = onMessageActions((actions: any) => {
    if (!hooksInstalled) return;
    if (typeof actions.sendMessage === 'function') {
      activeUnpatches.push(
        before(actions, 'sendMessage', (channelId: any, message: any) => {
          runPipelineOnMessage(String(channelId ?? ''), message, false, false);
        }),
      );
    }
    if (typeof actions._sendMessage === 'function') {
      activeUnpatches.push(
        before(actions, '_sendMessage', (channelId: any, message: any) => {
          runPipelineOnMessage(String(channelId ?? ''), message, true, false);
        }),
      );
    }
    if (typeof actions.editMessage === 'function') {
      activeUnpatches.push(
        before(actions, 'editMessage', (channelId: any, _messageId: any, message: any) => {
          runPipelineOnMessage(String(channelId ?? ''), message, false, false);
        }),
      );
    }
  });

  cancelHttpWait = onHttpClient((http: any) => {
    if (!hooksInstalled) return;
    for (const method of ['post', 'patch'] as const) {
      if (typeof http?.[method] !== 'function') continue;
      activeUnpatches.push(
        before(http, method, (req: any) => {
          if (!req || typeof req !== 'object' || typeof req.url !== 'string') return;
          const m = MESSAGES_POST_RE.exec(req.url);
          if (!m || !req.body || typeof req.body !== 'object') return;
          runPipelineOnMessage(m[1], req.body, true, true);
        }),
      );
    }
  });
}

function teardownOutgoingHooksIfEmpty(): void {
  if (outgoingTransforms.size > 0 || !hooksInstalled) {
    return;
  }
  hooksInstalled = false;
  cancelActionsWait?.();
  cancelActionsWait = null;
  cancelHttpWait?.();
  cancelHttpWait = null;
  while (activeUnpatches.length > 0) {
    activeUnpatches.pop()?.();
  }
  downstreamTokens.clear();
}

/**
 * Hooks outgoing message sends and edits across {@code MessageActionCreators} and {@code HTTP}
 * to rewrite {@code content} strings before Discord transmits them.
 */
export function patchOutgoingMessageContent(
  transform: (content: string, channelId: string) => string,
): () => void {
  outgoingTransforms.add(transform);
  transformList = Array.from(outgoingTransforms);
  ensureOutgoingHooks();

  return () => {
    outgoingTransforms.delete(transform);
    transformList = Array.from(outgoingTransforms);
    teardownOutgoingHooksIfEmpty();
  };
}
