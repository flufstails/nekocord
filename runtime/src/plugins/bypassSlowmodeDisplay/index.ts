import { createZeroStoreMethodPlugin } from '../_shared/fluxAndPrivacy.js';

export default createZeroStoreMethodPlugin('CooldownStore', ['getRemainingSlowmode'], 0);
