---
name: StripExifFileNames
description: Replaces camera date-stamped filenames (`IMG_`, `PXL_`, `DSC_`) with neutral names.
authors:
  - name: flufstails
    icon: https://avatars.githubusercontent.com/u/244251958?v=4
category: privacy
isNew: true
tags:
  - privacy
  - uploads
  - metadata
---

# StripExifFileNames

Sanitizes outgoing camera photo filenames (`IMG_YYYYMMDD_...`, `PXL_...`, `DSC_...`) before upload so timestamps are not leaked in filenames.
