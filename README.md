<p align="center">
  <img src="assets/nekocord-logo.png" width="180" alt="Nekocord logo" />
</p>

# Nekocord

![Release](https://img.shields.io/badge/release-v1.2.0-5865F2)
![Plugins](https://img.shields.io/badge/plugins-250%20built--in-23A55A)
[![License](https://img.shields.io/badge/license-GPL--3.0-blue)](LICENSE)

**Your cutest Discord client on mobile.** Nekocord `v1.2.0` is a fast, clean TypeScript plugin runtime and live theme engine for Discord Android (`353.11`), shipping with **250 Vencord-style built-in plugins** and Vendetta/Bunny theme support.

> [!NOTE]
> Verified on Discord Android `353.11` (`arm64-v8a`). Patched builds keep the standard `com.discord` package ID by default, or pass `--package com.nekocord` for a side-by-side install.

## Features

- **Individual Vencord Settings Pages & Vector Icons:** Injects standalone **Nekocord**, **Plugins**, **Themes**, **Updater**, and **Backup & Restore** screens into Discord User Settings with crisp native `react-native-svg` Vencord icons, a custom `NC` logo badge, `SpecialCard`, `Quick Actions`, bordered addon cards, and `PluginModal` detail sheets.
- **Vencord-Grade Plugin Architecture & Interactive Settings:** All 250 plugins live in `runtime/src/plugins/<slug>/` with `index.ts` and YAML-backed `README.md` docs, plus typed `definePluginSettings(...)` options (`BOOLEAN`, `STRING`, `NUMBER`, `SELECT`) wired directly into core plugins (`FakeNitro`, `MessageLogger`, `FixEmbeds`, `NoTrack`, `ShowMeYourName`, `FullTimestamps`, `IrcColors`, `TextReplace`, `MessageLatency`, `OnePingPerDM`, `VolumeBooster`, `LoadingQuotes`).
- **Portable Backup & Restore + OTA Updates:** Export and restore plugin toggles, per-plugin settings, starred favorites, custom themes, and update sources as JSON, or pull new JS bundles directly from GitHub Releases on `flufstails/nekocord`.
- **FakeNitro Unlock & Native Chat Rendering:** Unlocks external emojis, animated emojis, and Nitro stickers in the picker, converts locked sends and edits into clean CDN links, and renders received links back into native Discord emojis and stickers inline.
- **Inline MessageLogger:** Preserves deleted messages inline in chat with a `deleted` badge and renders prior edit revisions above edited messages.
- **High-Speed Metro & Theme Engine:** Uses an O(1) incremental Metro candidate cache, a single multiplexed export watcher, and cached semantic/raw token resolution across 6 curated built-in themes (`AMOLED Pitch`, `Catppuccin Mocha`, `Rose Pine`, `Nordic Frost`, `Sakura Cream`, `Tokyo Night`) plus Online Themes JSON URL installs.

## Plugin Categories

| Category | Count | Highlights |
| :--- | :--- | :--- |
| **Chat** | 102 | `MessageLogger`, `FixImagesQuality`, `IrcColors`, `ReplyTimestamp`, `MessageLatency`, `Unindent`, `TextReplace`, `NoReplyMention`, `NoBlockedMessages`, `RevealAllSpoilers`, `FullTimestamps` |
| **UI** | 50 | `ForceOwnerCrown`, `RoleColorEverywhere`, `ShowTimeoutDuration`, `MemberCount`, `HideGiftButton`, `HideAppsButton`, `NoProfileThemes`, `BetterRoleDot`, `NekocordSettingsUI` (core) |
| **Privacy** | 38 | `NoTrack`, `ClearURLs`, `SilentTyping`, `IgnoreActivities`, `OnePingPerDM`, `CustomIdle`, `NoDevtoolsWarning`, `AnonymiseFileNames`, `SuppressReadReceipts` |
| **Utility** | 24 | `ShowHiddenChannels`, `PermissionFreeWill`, `KeepCurrentChannel`, `ReplaceGoogleSearch`, `OverrideForumDefaults`, `AlwaysTrust`, `NSFWGateBypass`, `RelationshipNotifier` |
| **Developer** | 16 | `DeveloperMode`, `Experiments`, `ReactErrorDecoder`, `BypassSlowmodeDisplay`, `UnixTimestamps`, `SnowflakeIdsInChat`, `Base64EncodeMacro` |
| **Nitro** | 10 | `FakeNitro`, `SpotifyCrack`, `AlwaysAnimate`, `NoGifAutoplay`, `ForceNitroVisuals`, `UnlockClientThemes`, `UnlockBurstChecks`, `HidePremiumUpsells` |
| **Voice** | 9 | `VolumeBooster`, `CallTimer`, `DisableCallIdle`, `StreamerModeOnStream`, `FakeDeafen`, `VoiceMuteOnJoin`, `VoiceDeafenOnJoin` |
| **Core** | 1 | `NekocordBanner` |

Browse the complete catalog in [PLUGINS.md](docs/PLUGINS.md), or open **User Settings > Nekocord** inside the app.

## Installation

### Option 1: GitHub Releases (Recommended)

1. Download `nekocord-v1.2.0-arm64-v8a.apks` from [GitHub Releases](https://github.com/flufstails/nekocord/releases/latest).
2. Install the split APK bundle using SAI, ZArchiver, or MT Manager (or extract the `.apks` archive and install over ADB):
   ```sh
   adb install-multiple *.apk
   ```
3. Open **User Settings > Nekocord** (**Plugins**, **Themes**, **Updater**, or **Backup & Restore**) inside Discord.

> [!TIP]
> Because default builds use `com.discord`, uninstall stock Discord first if upgrading from an unmodified Play Store installation. For updates between Nekocord releases, open **User Settings > Updater** in-app to pull new runtime JS bundles straight from `flufstails/nekocord`.

### Option 2: Build From Source

**Prerequisites:** Node.js 20+, JDK 11+, Python 3, Android SDK (`build-tools` and `platforms`, auto-detected via `ANDROID_HOME` or `ANDROID_SDK_ROOT`), `apktool.jar` (via `APKTOOL_JAR` or `~/apktool/apktool.jar`), and stock Discord split APKs placed in `apk/`.

```sh
npm install
npm run typecheck
npm run patch
```

Signed split APKs are written to `out/` and archived as `dist/nekocord-v1.2.0-arm64-v8a.apks`.

Optional commands:

```sh
# Patch and install directly to a connected device over ADB
node patcher/patch.mjs --install --serial <device-serial>

# Build with a custom package ID for side-by-side installs
node patcher/patch.mjs --package com.nekocord

# Push updated runtime JS over ADB without rebuilding APKs
npm run push:dev -- --serial <device-serial>
```

## Author

Created and maintained by [flufstails](https://github.com/flufstails).

## License

Licensed under the [GNU General Public License v3.0](LICENSE).
