import { createDispatcherObserverPlugin } from '../_shared/fluxAndPrivacy.js';

export default createDispatcherObserverPlugin('RELATIONSHIP_REMOVE', (a) => (a.relationship?.id ? `User ${a.relationship.id}` : null));
