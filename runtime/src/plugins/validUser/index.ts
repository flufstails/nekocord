import { getUserStore } from '../../metro/common.js';
import { createRowPlugin } from '../_shared/chatDisplay.js';

const MENTION_SINGLE_RE = /<@!?(\d{15,22})>/;
const MENTION_GLOBAL_RE = /<@!?(\d{15,22})>/g;

function resolveAstMentions(nodes: any[], userStore: any): boolean {
  let mutated = false;
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (typeof node === 'string') {
      if (MENTION_SINGLE_RE.test(node)) {
        const next = node.replace(MENTION_GLOBAL_RE, (raw: string, id: string) => {
          const u = userStore.getUser(id);
          return u?.username ? `@${u.username}` : raw;
        });
        if (next !== node) {
          nodes[i] = next;
          mutated = true;
        }
      }
      continue;
    }
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'mention' && node.userId) {
      const u = userStore.getUser(String(node.userId));
      const existing = typeof node.content === 'string'
        ? node.content
        : Array.isArray(node.content) && typeof node.content[0]?.content === 'string'
          ? node.content[0].content
          : '';
      if (u?.username && (!existing || /unknown|user/i.test(existing) || /\d{15,22}/.test(existing))) {
        node.content = [{ type: 'text', content: `@${u.username}` }];
        mutated = true;
      }
    } else if (node.type === 'text' && typeof node.content === 'string' && MENTION_SINGLE_RE.test(node.content)) {
      const next = node.content.replace(MENTION_GLOBAL_RE, (raw: string, id: string) => {
        const u = userStore.getUser(id);
        return u?.username ? `@${u.username}` : raw;
      });
      if (next !== node.content) {
        node.content = next;
        mutated = true;
      }
    } else if (Array.isArray(node.content) && resolveAstMentions(node.content, userStore)) {
      mutated = true;
    }
  }
  return mutated;
}

export default createRowPlugin((_row, msg) => {
  const userStore = getUserStore();
  if (!userStore?.getUser) return false;
  if (typeof msg.content === 'string') {
    if (!MENTION_SINGLE_RE.test(msg.content)) return false;
    const next = msg.content.replace(MENTION_GLOBAL_RE, (raw: string, id: string) => {
      const u = userStore.getUser(id);
      return u?.username ? `@${u.username}` : raw;
    });
    if (next !== msg.content) {
      msg.content = next;
      return true;
    }
    return false;
  }
  if (Array.isArray(msg.content)) {
    return resolveAstMentions(msg.content, userStore);
  }
  return false;
});
