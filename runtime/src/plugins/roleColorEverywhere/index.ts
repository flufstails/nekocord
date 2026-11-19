import { toAndroidColor } from '../../chat/rows.js';
import { getChannelStore, getStore } from '../../metro/common.js';
import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (typeof msg.usernameColor === 'number' && msg.usernameColor !== 0) {
    return false;
  }
  if (!msg.authorId || !msg.channelId) return false;
  const ch = getChannelStore()?.getChannel?.(String(msg.channelId));
  const guildId = ch?.guild_id;
  if (!guildId) return false;
  const member = getStore<any>('GuildMemberStore')?.getMember?.(guildId, String(msg.authorId));
  if (member?.colorString && /^#[0-9a-fA-F]{6}$/.test(member.colorString)) {
    const hex = member.colorString.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    msg.usernameColor = toAndroidColor(255, r, g, b);
    return true;
  }
  return false;
});
