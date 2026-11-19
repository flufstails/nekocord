---
name: OverrideForumDefaults
description: "Sets forum channels to sort threads by Latest Activity by default."
authors:
  - flufstails
category: utility
enabledByDefault: false
tags:
  - utility
  - forums
  - ui
---

# OverrideForumDefaults

Patches `ChannelStore.getChannel` on forum channels (`type === 15`) so threads open sorted by latest activity.
