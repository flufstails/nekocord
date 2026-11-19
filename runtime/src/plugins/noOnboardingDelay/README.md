---
name: NoOnboardingDelay
description: "Removes artificial prompt countdown delays during server onboarding screens."
authors:
  - name: flufstails
    icon: https://avatars.githubusercontent.com/u/244251958?v=4
category: ui
enabledByDefault: false
tags:
  - ui
  - onboarding
  - guilds
---

# NoOnboardingDelay

Intercepts `GUILD_ONBOARDING_` Flux dispatches and clears client-side confirmation timers immediately.
