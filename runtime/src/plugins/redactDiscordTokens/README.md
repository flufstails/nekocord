---
name: RedactDiscordTokens
description: Redacts accidental Discord authentication tokens before sending messages.
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

# RedactDiscordTokens

Detects 3-part Discord token patterns outside code blocks and replaces them with `[redacted-token]` on send.
