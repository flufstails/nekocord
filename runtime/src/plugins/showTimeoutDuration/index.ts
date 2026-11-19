import { getChannelStore, getStore } from '../../metro/common.js';
import { appendTimestampNote, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  if (!msg.authorId || !msg.channelId) return false;
  const channel = getChannelStore()?.getChannel?.(String(msg.channelId));
  const guildId = channel?.guild_id;
  if (!guildId) return false;
  const member = getStore<any>('GuildMemberStore')?.getMember?.(guildId, String(msg.authorId));
  const until = member?.communicationDisabledUntil;
  if (typeof until !== 'string' || !until) return false;
  const remainingMs = Date.parse(until) - Date.now();
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return false;
  const mins = Math.max(1, Math.ceil(remainingMs / 60000));
  return appendTimestampNote(msg, `[timed out ${mins}m]`);
});
