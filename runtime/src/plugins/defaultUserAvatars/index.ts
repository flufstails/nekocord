import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      const fallback = 'https://cdn.discordapp.com/embed/avatars/0.png';
      if (typeof msg.avatarURL === 'string' && msg.avatarURL !== fallback) {
        msg.avatarURL = fallback;
        return true;
      }
      return false;
    });
