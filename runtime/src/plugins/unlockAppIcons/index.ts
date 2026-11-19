import { createNamedOverridePlugin } from '../_shared/fluxAndPrivacy.js';

export default createNamedOverridePlugin(
  ['canUseCustomAppIcon', 'canUseAppIcons', 'canChangeAppIcon'],
  true,
);
