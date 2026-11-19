<p align="center">
  <img src="assets/nekocord-logo.png" width="180" alt="Nekocord logo" />
</p>

# Nekocord

![Release](https://img.shields.io/badge/release-v1.3.0-5865F2)
![Plugins](https://img.shields.io/badge/plugins-300%20built--in-23A55A)
[![License](https://img.shields.io/badge/license-GPL--3.0-blue)](LICENSE)

**Your cutest Discord client on mobile.** Nekocord `v1.3.0` is a fast, clean TypeScript plugin runtime and live theme engine for Discord Android (`353.11`), shipping with **300 Vencord-style built-in plugins** and Vendetta/Bunny theme support.

> [!NOTE]
> Verified on Discord Android `353.11` (`arm64-v8a`). Patched builds keep the standard `com.discord` package ID by default, or pass `--package com.nekocord` for a side-by-side install.

## Features

- **Discord-Native UI, Standalone Pages & Author Avatars:** Injects individual **Nekocord**, **Plugins**, **Themes**, **Updater**, and **Backup & Restore** screens into Discord User Settings with animated Discord-style check/cross capsule switches, native `react-native-svg` Vencord icons, custom `NC` mascot branding, and clickable author avatar chips.
- **300 Built-in Plugins & Typed Settings:** All plugins live in `runtime/src/plugins/<slug>/` with `index.ts` and YAML-backed `README.md` metadata (`authors` with `name` + `icon` avatar URLs), plus interactive `definePluginSettings(...)` options (`BOOLEAN`, `STRING`, `NUMBER`, `SELECT`) wired into 18 flagship plugins.
- **Portable Backup & Restore + OTA Updates:** Export and restore plugin toggles, per-plugin settings, starred favorites, custom themes, and update sources as JSON, or pull new JS bundles directly from GitHub Releases on `flufstails/nekocord`.
- **FakeNitro Unlock & Native Chat Rendering:** Unlocks external emojis, animated emojis, and Nitro stickers in the picker, converts locked sends and edits into clean CDN links, and renders received links back into native Discord emojis and stickers inline.
- **Inline MessageLogger:** Preserves deleted messages inline in chat with a `deleted` badge and renders prior edit revisions above edited messages.
- **High-Speed Metro & Theme Engine:** Uses an O(1) incremental Metro candidate cache, a single multiplexed export watcher, and cached semantic/raw token resolution across 6 curated built-in themes (`AMOLED Pitch`, `Catppuccin Mocha`, `Rose Pine`, `Nordic Frost`, `Sakura Cream`, `Tokyo Night`) plus Online Themes JSON URL installs.

## Plugin Categories

| Category | Count | Highlights |
| :--- | :--- | :--- |
| **Chat** | 120 | `MessageLogger`, `MentionAlertHighlight`, `CustomTimestamps`, `ChatPrefixSuffix`, `WordCounter`, `FixEmbeds`, `IrcColors`, `ShowMeYourName`, `FullTimestamps` |
| **UI** | 58 | `ForceOwnerCrown`, `RoleColorEverywhere`, `HideBotCommandsHeader`, `HideServerTagBadges`, `NoRoleGradient`, `MemberCount`, `NekocordSettingsUI` (core) |
| **Privacy** | 53 | `NoTrack`, `AutoSpoilerAttachments`, `AnonymiseLinks`, `RedactDiscordTokens`, `RedactApiKeys`, `CleanYoutubeTracking`, `SilentTyping`, `ClearURLs` |
| **Utility** | 27 | `ShowHiddenChannels`, `PermissionFreeWill`, `KeepCurrentChannel`, `FxEmbedsBluesky`, `CleanEbayLinks`, `AlwaysTrust`, `NSFWGateBypass`, `RelationshipNotifier` |
| **Developer** | 19 | `DeveloperMode`, `Experiments`, `HexColorPreviewTag`, `JsonFormatMacro`, `EpochDecodeMacro`, `ReactErrorDecoder`, `UnixTimestamps` |
| **Nitro** | 11 | `FakeNitro`, `UnlockAppIcons`, `SpotifyCrack`, `AlwaysAnimate`, `NoGifAutoplay`, `ForceNitroVisuals`, `UnlockClientThemes`, `UnlockBurstChecks` |
| **Voice** | 11 | `VolumeBooster`, `VoiceDeafenOnLeave`, `BlockStreamPreview`, `CallTimer`, `DisableCallIdle`, `StreamerModeOnStream`, `FakeDeafen`, `VoiceMuteOnJoin` |
| **Core** | 1 | `NekocordBanner` |

## Documentation

- [Plugin Catalog](docs/PLUGINS.md): Complete table of all 300 built-in plugins organized by category.
- [How to Make a Plugin](docs/HOW_TO_MAKE_A_PLUGIN.md): Directory layout, YAML frontmatter with author icons, `definePlugin`, `definePluginSettings`, and runtime APIs.
- [Contributing Guide](docs/CONTRIBUTING.md): Prerequisites, repository layout, local build/ADB workflow, and pull request checklist.

## Installation

### Option 1: GitHub Releases (Recommended)

1. Download `nekocord-v1.3.0-arm64-v8a.apks` from [GitHub Releases](https://github.com/flufstails/nekocord/releases/latest).
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

Signed split APKs are written to `out/` and archived as `dist/nekocord-v1.3.0-arm64-v8a.apks`.

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
