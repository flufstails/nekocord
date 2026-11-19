import { createNamedOverridePlugin } from '../_shared/fluxAndPrivacy.js';

export default createNamedOverridePlugin(
  ['shouldShowStickerPickerSuggestions', 'canSuggestStickers', 'shouldShowStickerSuggestions'],
  false,
);
