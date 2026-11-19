import { clearArrayProp, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => clearArrayProp(msg, 'components'));
