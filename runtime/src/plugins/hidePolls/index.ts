import { createRowPlugin, clearProp } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => clearProp(msg, 'pollData'));
