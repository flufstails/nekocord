import { getChannelStore, getStore } from '../../metro/common.js';
import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!msg.authorId || !msg.channelId || typeof msg.username !== 'string') {
    return false;
  }
  const channel = getChannelStore()?.getChannel?.(String(msg.channelId));
  const guildId = channel?.guild_id;
  if (!guildId) return false;
  const guild = getStore<any>('GuildStore')?.getGuild?.(guildId);
  if (!guild?.ownerId || String(guild.ownerId) !== String(msg.authorId)) {
    return false;
  }
  if (msg.username.includes('[Owner]')) return false;
  msg.username = `${msg.username} [Owner]`;
  return true;
});
