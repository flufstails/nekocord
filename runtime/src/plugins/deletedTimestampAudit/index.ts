import { createDispatcherObserverPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherObserverPlugin('MESSAGE_DELETE', (a) => (a.id ? `Msg ${a.id} in ${a.channelId ?? '?'}` : null));
