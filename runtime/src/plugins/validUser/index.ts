import { getUserStore } from '../../metro/common.js';
import { createRowPlugin } from '../_shared/chatDisplay.js';

const MENTION_RE = /<@!?(\d{15,22})>/g;

export default createRowPlugin((_row, msg) => {
  const userStore = getUserStore();
  if (!userStore?.getUser) return false;
  if (typeof msg.content === 'string' && MENTION_RE.test(msg.content)) {
    const next = msg.content.replace(MENTION_RE, (raw, id) => {
      const u = userStore.getUser(id);
      return u?.username ? `@${u.username}` : raw;
    });
    if (next !== msg.content) {
      msg.content = next;
      return true;
    }
  }
  return false;
});
