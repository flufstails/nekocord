---
name: MemberCount
description: "Tracks live online and total guild member counts across server list updates."
authors:
  - flufstails
category: ui
enabledByDefault: false
tags:
  - ui
  - guilds
  - utility
---

# MemberCount

Caches `GUILD_MEMBER_LIST_UPDATE` and `GUILD_CREATE` member totals for instant lookup without redundant API fetches.
