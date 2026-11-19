<p align="center">
  <img src="assets/nekocord-logo.png" width="180" alt="Nekocord logo" />
</p>

# Nekocord

![Release](https://img.shields.io/badge/release-v1.5.0-5865F2)
![Plugins](https://img.shields.io/badge/plugins-408%20built--in-23A55A)
[![License](https://img.shields.io/badge/license-GPL--3.0-blue)](LICENSE)

**The cutest Discord client on mobile.** Nekocord is a fast Discord mobile mod for Android (`353.11`) packed with **408 built-in plugins**, in-app custom plugin importing, and Custom CSS / JSON themes.

## Features

- **Easy to Install:** Ships as a signed split `.apks` bundle for Android with no root required, plus an in-app Updater for runtime updates between releases.
- **408 Built-in Plugins:** Ready out of the box with favorites like `FakeNitro`, `MessageLogger`, `AudioToVoiceMessage`, `CustomRPC`, `ClearURLs`, `ShowHiddenChannels`, `FakeDeafen`, and 27 configurable flagship plugins.
- **Custom Plugins & CSS Themes:** Import custom JS plugins by URL or pasted snippet directly inside Discord, and style the app using Custom CSS variables or JSON theme links with zero bundled theme clutter.
- **Notification Log & Floating Toasts:** Records mentions, DMs, friend updates, voice alerts, and plugin events in an organized log with floating in-app banners.
- **Privacy-Friendly:** Blocks Discord analytics, experiment tracking, crash reporting, and typing leaks locally.
- **Clean Settings & Backups:** Integrates straight into Discord User Settings with fast search, category filters, clean cards, and portable JSON Backup & Restore.

## Installing Nekocord

1. Download `nekocord-v1.5.0-arm64-v8a.apks` from [GitHub Releases](https://github.com/flufstails/nekocord/releases/latest).
2. Install the split APKs with SAI, ZArchiver, or MT Manager (or extract the archive and run `adb install-multiple *.apk`).
3. Open **User Settings > Nekocord** inside Discord to toggle plugins, import themes, or view notifications.

> [!TIP]
> Default builds use the standard `com.discord` package ID, so uninstall stock Play Store Discord first before installing. Want a side-by-side install instead? Build with `--package com.nekocord`.

## Building from Source

Requires Node.js 20+, JDK 11+, Python 3, Android SDK (`ANDROID_HOME` or `ANDROID_SDK_ROOT`), `apktool.jar` (`APKTOOL_JAR` or `~/apktool/apktool.jar`), and stock Discord Android split APKs in `apk/`.

```sh
npm install
npm run typecheck
npm run patch
```

Signed APKs are saved in `out/` and packaged as `dist/nekocord-v1.5.0-arm64-v8a.apks`.

Useful commands:

```sh
# Build and install directly over ADB
node patcher/patch.mjs --install --serial <device-serial>

# Build with a separate package name for side-by-side install
node patcher/patch.mjs --package com.nekocord

# Push updated runtime JS over ADB without rebuilding APKs
npm run push:dev -- --serial <device-serial>
```

## Docs & Contributing

- [Plugin List](docs/PLUGINS.md): Every built-in plugin organized by category.
- [How to Make a Plugin](docs/HOW_TO_MAKE_A_PLUGIN.md): Build built-in TypeScript plugins or quick runtime JS plugins.
- [Contributing Guide](docs/CONTRIBUTING.md): Project structure, ADB test workflow, and pull request checklist.

## Disclaimer

Client modifications violate Discord's Terms of Service. Although accounts rarely face action for personal client mods, use Nekocord at your own discretion.

## Author & License

Created and maintained by [flufstails](https://github.com/flufstails). Licensed under the [GNU General Public License v3.0](LICENSE).
