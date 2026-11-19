---
name: MessageLogger
description: Keeps deleted messages and previous edit revisions inline in chat.
authors:
  - flufstails
category: chat
enabledByDefault: true
requiresRestart: true
tags:
  - messages
  - deleted
  - history
  - edits
---

# MessageLogger

Intercepts deleted and edited message events on Discord's Flux dispatcher and keeps deleted messages highlighted inline in chat with a `deleted` badge. Edited messages display previous revisions above the latest message body.
