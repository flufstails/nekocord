---
name: ValidReply
description: "Labels replies whose referenced message target is unavailable or deleted."
authors:
  - flufstails
category: chat
enabledByDefault: false
tags:
  - chat
  - replies
  - utility
---

# ValidReply

Inspects inline `referencedMessage` blocks and adds a clear `[reply unavailable]` note when Discord cannot load the parent message.
