import { clearProp, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => (msg.webhookId ? clearProp(msg, 'tagText') : false));
