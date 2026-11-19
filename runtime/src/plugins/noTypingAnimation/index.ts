import { createNamedOverridePlugin } from '../_shared/fluxAndPrivacy.js';

export default createNamedOverridePlugin(
  ['useTypingAnimation', 'shouldAnimateTyping', 'TypingIndicatorAnimation'],
  false,
);
