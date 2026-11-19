---
name: RedactPrivateKeys
description: Redacts accidental PEM private key blocks before sending chat messages.
authors:
  - name: flufstails
    icon: https://avatars.githubusercontent.com/u/244251958?v=4
category: privacy
isNew: true
tags:
  - security
  - redaction
  - privacy
---

# RedactPrivateKeys

Replaces pasted PEM `-----BEGIN ... PRIVATE KEY-----` blocks outside code spans with `[redacted-private-key]`.
