import { createDispatcherBlockerPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherBlockerPlugin((a) =>
      a.type === 'GIFT_CODE_MODAL_OPEN' ||
      a.type === 'PREMIUM_UPSELL_VIEWED' ||
      a.type.startsWith('PREMIUM_MARKETING_'));
