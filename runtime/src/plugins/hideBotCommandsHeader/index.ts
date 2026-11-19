import { clearProp, createRowPlugin } from '../_shared/chatDisplay.js';

export default createRowPlugin((_row, msg) => {
  const a = clearProp(msg, 'interaction');
  const b = clearProp(msg, 'interactionMetadata');
  return a || b;
});
