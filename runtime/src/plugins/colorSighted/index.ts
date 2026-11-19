import { createZeroStoreMethodPlugin } from '../_shared/fluxAndPrivacy.js';

export default createZeroStoreMethodPlugin(
  'AccessibilityStore',
  ['useForcedColors', 'isColorblindModeEnabled'],
  false,
);
