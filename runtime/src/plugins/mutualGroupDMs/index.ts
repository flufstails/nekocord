import { getChannelStore } from '../../metro/common.js';
import { definePlugin } from '../types.js';

export function findMutualGroupDmsForUser(userId: string): Array<{ id: string; name: string }> {
  const chStore = getChannelStore();
  const map = chStore?.getMutablePrivateChannels?.() ?? chStore?.getSortedPrivateChannels?.();
  if (!map) return [];
  const list = Array.isArray(map) ? map : Object.values(map);
  const hits: Array<{ id: string; name: string }> = [];
  for (let i = 0; i < list.length; i += 1) {
    const ch = list[i] as any;
    if (ch?.type === 3 && Array.isArray(ch.recipients) && ch.recipients.includes(userId)) {
      hits.push({ id: String(ch.id), name: String(ch.name || 'Group DM') });
    }
  }
  return hits;
}

export default definePlugin({
  start() {},
  stop() {},
});
