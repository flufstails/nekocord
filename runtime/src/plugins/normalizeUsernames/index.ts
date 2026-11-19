import { createRowPlugin, CONTROL_RE } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      if (typeof msg.username !== 'string' || !msg.username) {
        return false;
      }
      const cleaned = msg.username.replace(CONTROL_RE, '').replace(/\s{2,}/g, ' ').trim();
      if (cleaned && cleaned !== msg.username) {
        msg.username = cleaned;
        return true;
      }
      return false;
    });
