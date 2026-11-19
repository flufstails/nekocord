import { createRowPlugin, clearArrayProp } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => clearArrayProp(msg, 'attachments'));
