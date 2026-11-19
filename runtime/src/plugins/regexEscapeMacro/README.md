---
name: RegexEscapeMacro
description: Escapes regular-expression metacharacters via `\\re:<literal>` on send.
authors:
  - name: flufstails
    icon: https://avatars.githubusercontent.com/u/244251958?v=4
category: developer
isNew: true
tags:
  - developer
  - regex
  - macro
---

# RegexEscapeMacro

Converts `\\re:foo.bar(baz)` into `foo\\.bar\\(baz\\)` for regex-safe sharing.
