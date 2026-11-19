import { createNamedOverridePlugin } from '../_shared/fluxAndPrivacy.js';

export default createNamedOverridePlugin(
  ['isHiddenSetting', 'shouldShowHiddenBadges', 'canViewHiddenDebug'],
  true,
);
