import { createNamedOverridePlugin } from '../_shared/fluxAndPrivacy.js';

export default createNamedOverridePlugin(
  ['shouldShowGiftButton', 'shouldShowNitroGiftUpsell', 'canGiftNitroPromo'],
  false,
);
