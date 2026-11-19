import { onMessageActions } from '../metro/common.js';
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

/**
 * Hooks {@code MessageActionCreators.sendMessage} and {@code editMessage} to rewrite
 * outgoing {@code message.content} strings before Discord sends them.
 */
export function patchOutgoingMessageContent(
  transform: (content: string, channelId: string) => string,
): () => void {
  let active = true;
  let unpatchSend: Unpatch | null = null;
  let unpatchEdit: Unpatch | null = null;

  const cancelWait = onMessageActions((actions) => {
    if (!active) {
      return;
    }
    if (!unpatchSend && typeof actions.sendMessage === 'function') {
      unpatchSend = before(actions, 'sendMessage', (channelId: any, message: any) => {
        if (message && typeof message.content === 'string') {
          const next = transform(message.content, String(channelId ?? ''));
          if (next !== message.content) {
            message.content = next;
          }
        }
      });
    }
    if (!unpatchEdit && typeof actions.editMessage === 'function') {
      unpatchEdit = before(
        actions,
        'editMessage',
        (channelId: any, _messageId: any, message: any) => {
          if (message && typeof message.content === 'string') {
            const next = transform(message.content, String(channelId ?? ''));
            if (next !== message.content) {
              message.content = next;
            }
          }
        },
      );
    }
  });

  return () => {
    active = false;
    cancelWait();
    if (unpatchSend) {
      unpatchSend();
      unpatchSend = null;
    }
    if (unpatchEdit) {
      unpatchEdit();
      unpatchEdit = null;
    }
  };
}
