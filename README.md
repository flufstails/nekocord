<p align="center">
  <img src="assets/nekocord-logo.png" width="180" alt="Nekocord logo" />
</p>

# Nekocord

![Release](https://img.shields.io/badge/release-v1.4.0-5865F2)
![Plugins](https://img.shields.io/badge/plugins-401%20built--in-23A55A)
[![License](https://img.shields.io/badge/license-GPL--3.0-blue)](LICENSE)

**Your cutest Discord client on mobile.** Nekocord `v1.4.0` is a fast, clean TypeScript plugin runtime and custom theme engine for Discord Android (`353.11`), shipping with **401 Vencord-style built-in plugins** and Custom CSS / JSON theme support.

> [!NOTE]
> Verified on Discord Android `353.11` (`arm64-v8a`). Patched builds keep the standard `com.discord` package ID by default, or pass `--package com.nekocord` for a side-by-side install.

## Features

- **Notification Log & Toast Banners:** Captures live Discord mentions, DMs, relationship alerts, and plugin logs into a standalone **Notification Log** screen with non-blocking in-app toast banners.
- **Custom Plugin & CSS Theme Importers:** Import custom JS plugins by URL or pasted source directly in-app (`definePlugin` / `Nekocord`), and install custom `.css` variable themes or Vendetta/Bunny `.json` themes cleanly with zero bundled theme bloat.
- **Badge-Free Plugin Cards & CustomRPC:** Moves tags and badges into Plugin Info with inline cog and info icons beside each title, Discord-native capsule toggles, circular author avatars, and full `CustomRPC` Rich Presence support.
- **401 Built-in Plugins & Typed Settings:** Every plugin lives under `runtime/src/plugins/<slug>/` with `index.ts` and YAML-backed `README.md` metadata (`authors` with `name` + `icon` avatar URLs), plus interactive `definePluginSettings(...)` options wired into 25 flagship plugins.
- **Portable Backup & Restore + OTA Updates:** Export and restore plugin toggles, imported plugins, per-plugin settings, notification settings, favorites, custom themes, and update sources as JSON, or pull new JS bundles from GitHub Releases.
- **FakeNitro Unlock & Inline MessageLogger:** Unlocks external emojis, animated emojis, and Nitro stickers with clean CDN conversion and native inline chat rendering, alongside inline deleted/edited message logging.

## Plugin Categories

| Category | Count | Highlights |
| :--- | :--- | :--- |
| **Chat** | 145 | `MessageLogger`, `AutoReplyAway`, `MentionAlertHighlight`, `CustomTimestamps`, `WordCounter`, `HighlightMentionsOfMe`, `IrcColors`, `ShowMeYourName` |
| **UI** | 74 | `CustomRPC`, `CustomEmbedColorAccent`, `ForceOwnerCrown`, `RoleColorEverywhere`, `HideBotCommandsHeader`, `HideServerTagBadges`, `NoRoleGradient`, `NekocordSettingsUI` (core) |
| **Privacy** | 73 | `NoTrack`, `KeywordBlocker`, `AutoSpoilerAttachments`, `AnonymiseLinks`, `RedactAwsKeys`, `RedactDiscordTokens`, `CleanBilibiliLinks`, `SilentTyping`, `ClearURLs` |
| **Utility** | 50 | `QuickSnippetMacros`, `CountdownTimestampMacro`, `UuidGeneratorMacro`, `PresenceLogger`, `ShowHiddenChannels`, `PermissionFreeWill`, `CleanGoogleSearchLinks` |
| **Developer** | 30 | `DeveloperMode`, `Experiments`, `SnowflakeAgeBadge`, `InspectMessageIdBadge`, `SlugifyMacro`, `HexColorPreviewTag`, `JsonFormatMacro`, `EpochDecodeMacro` |
| **Nitro** | 11 | `FakeNitro`, `UnlockAppIcons`, `SpotifyCrack`, `AlwaysAnimate`, `NoGifAutoplay`, `ForceNitroVisuals`, `UnlockClientThemes`, `UnlockBurstChecks` |
| **Voice** | 17 | `VoiceJoinNotifier`, `CallAlertLogger`, `VolumeBooster`, `VoiceDeafenOnLeave`, `BlockStreamPreview`, `VoiceMuteOnDeafen`, `KeepVoiceAlive`, `FakeDeafen` |
| **Core** | 1 | `NekocordBanner` |

## Documentation

- [Plugin Catalog](docs/PLUGINS.md): Complete table of all 401 built-in plugins organized by category.
- [How to Make a Plugin](docs/HOW_TO_MAKE_A_PLUGIN.md): Directory layout, YAML frontmatter with author icons, runtime JS imports, `definePlugin`, `definePluginSettings`, and APIs.
- [Contributing Guide](docs/CONTRIBUTING.md): Prerequisites, repository layout, local build/ADB workflow, and pull request checklist.

## Installation

### Option 1: GitHub Releases (Recommended)

1. Download `nekocord-v1.4.0-arm64-v8a.apks` from [GitHub Releases](https://github.com/flufstails/nekocord/releases/latest).
2. Install the split APK bundle using SAI, ZArchiver, or MT Manager (or extract the `.apks` archive and install over ADB):
   ```sh
   adb install-multiple *.apk
   ```
3. Open **User Settings > Nekocord** (**Plugins**, **Themes**, **Notification Log**, **Updater**, or **Backup & Restore**) inside Discord.

> [!TIP]
> Because default builds use `com.discord`, uninstall stock Discord first if upgrading from an unmodified Play Store installation. For updates between Nekocord releases, open **User Settings > Updater** in-app to pull new runtime JS bundles straight from `flufstails/nekocord`.

### Option 2: Build From Source

**Prerequisites:** Node.js 20+, JDK 11+, Python 3, Android SDK (`build-tools` and `platforms`, auto-detected via `ANDROID_HOME` or `ANDROID_SDK_ROOT`), `apktool.jar` (via `APKTOOL_JAR` or `~/apktool/apktool.jar`), and stock Discord split APKs placed in `apk/`.

```sh
npm install
npm run typecheck
npm run patch
```

Signed split APKs are written to `out/` and archived as `dist/nekocord-v1.4.0-arm64-v8a.apks`.

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
