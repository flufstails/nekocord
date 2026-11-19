import { createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
      if (!Array.isArray(msg.attachments) || msg.attachments.length === 0) {
        return false;
      }
      const marker = '[Alt:';
      if (typeof msg.content === 'string' && msg.content.includes(marker)) {
        return false;
      }
      const notes: string[] = [];
      for (let i = 0; i < msg.attachments.length; i += 1) {
        const desc = msg.attachments[i]?.description;
        if (typeof desc === 'string' && desc.trim().length > 0) {
          notes.push(`${marker} ${desc.trim()}]`);
        }
      }
      if (notes.length === 0) {
        return false;
      }
      const base = typeof msg.content === 'string' ? msg.content.trim() : '';
      msg.content = base ? `${base}\n${notes.join('\n')}` : notes.join('\n');
      return true;
    });
