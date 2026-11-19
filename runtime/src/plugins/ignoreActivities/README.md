---
name: IgnoreActivities
description: "Blocks local activity, running game, and rich presence broadcasts from leaving your device."
authors:
  - name: flufstails
    icon: https://avatars.githubusercontent.com/u/244251958?v=4
category: privacy
enabledByDefault: false
tags:
  - privacy
  - presence
  - rpc
---

# IgnoreActivities

Drops `LOCAL_ACTIVITY_UPDATE` and `RUNNING_GAMES_CHANGE` dispatches before presence sync runs.
