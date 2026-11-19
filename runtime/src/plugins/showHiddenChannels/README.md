---
name: ShowHiddenChannels
description: "Reveals locked guild channels and categories in the server sidebar (read-only metadata)."
authors:
  - name: flufstails
    icon: https://avatars.githubusercontent.com/u/244251958?v=4
category: utility
enabledByDefault: false
tags:
  - utility
  - channels
  - permissions
---

# ShowHiddenChannels

Patches `PermissionStore.can` so client-side channel list filters show `VIEW_CHANNEL`-restricted channels as visible entries.
