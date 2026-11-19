---
name: NoAnalyticsBeacons
description: Drops internal Discord impression, exposure, and heartbeat metric beacons.
authors:
  - flufstails
category: privacy
enabledByDefault: false
requiresRestart: true
tags:
  - privacy
---

# NoAnalyticsBeacons

Drops internal Discord impression, exposure, and heartbeat metric beacons.

Requires a client restart after toggling so Discord initializes cleanly with the updated hooks.
