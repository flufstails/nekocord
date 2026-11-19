---
name: RoleColorEverywhere
description: "Resolves and applies a member highest colored role to usernames when missing in chat rows."
authors:
  - name: flufstails
    icon: https://avatars.githubusercontent.com/u/244251958?v=4
category: ui
enabledByDefault: false
tags:
  - ui
  - roles
  - colors
---

# RoleColorEverywhere

Reads `GuildMemberStore.getMember` and `GuildStore.getRoles` to fill missing `usernameColor` values on guild messages.
