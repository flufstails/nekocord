import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      if (typeof msg.id !== 'string' || msg.id.length < 15) {
        return false;
      }
      const suffix = `#${msg.id.slice(-6)}`;
      const current = typeof msg.timestamp === 'string' ? msg.timestamp : '';
      if (current.includes(suffix)) {
        return false;
      }
      msg.timestamp = current ? `${current} ${suffix}` : suffix;
      return true;
    });
