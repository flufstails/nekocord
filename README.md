# Nekocord

![Release](https://img.shields.io/badge/release-v1.0.0-5865F2)
![Plugins](https://img.shields.io/badge/plugins-200%20built--in-23A55A)
[![License](https://img.shields.io/badge/license-GPL--3.0-blue)](LICENSE)

**Your cutest Discord client on mobile.** Nekocord `v1.0.0` is a fast, clean TypeScript plugin runtime and live theme engine for Discord Android (`353.11`), shipping with **200 Vencord-style built-in plugins** and Vendetta/Bunny theme support.

> [!NOTE]
> Verified on Discord Android `353.11` (`arm64-v8a`). Patched builds keep the standard `com.discord` package ID by default, or pass `--package com.nekocord` for a side-by-side install.

## Features

- **Vencord-Style Plugin Directory Architecture:** All 200 plugins live in dedicated `runtime/src/plugins/<slug>/` folders with `index.ts` and YAML-backed `README.md` documentation viewable directly inside the app.
- **Native User Settings Integration:** Adds **Nekocord**, **Plugins**, and **Themes** right into Discord User Settings with instant search across names, categories, and tags, zero-glitch memoized lists, restart prompts, and OTA GitHub Release updates.
- **FakeNitro Unlock & Native Chat Rendering:** Unlocks external emojis, animated emojis, and Nitro stickers in the picker, converts locked sends and edits into clean CDN links, and renders received links back into native Discord emojis and stickers inline.
- **Inline MessageLogger:** Preserves deleted messages inline in chat with a `deleted` badge and renders prior edit revisions above edited messages.
- **High-Speed Metro & Theme Engine:** Uses an O(1) incremental Metro candidate cache, a single multiplexed export watcher, and cached semantic/raw token resolution across 6 curated built-in themes (`AMOLED Pitch`, `Catppuccin Mocha`, `Rose Pine`, `Nordic Frost`, `Sakura Cream`, `Tokyo Night`) plus custom JSON theme URLs.

## Plugin Categories

| Category | Count | Highlights |
| :--- | :--- | :--- |
| **Chat** | 84 | `MessageLogger`, `NoReplyMention`, `NoBlockedMessages`, `RevealAllSpoilers`, `ShowMeYourName`, `FullTimestamps`, `CompactTimestamps`, `HighlightEveryonePings`, `VxTwitterLinks`, dice/math macros |
| **UI** | 37 | `HideGiftButton`, `HideAppsButton`, `NoProfileThemes`, `HideReactions`, `HidePolls`, `HidePronouns`, `HideUserBanners`, `HideEmbeds`, `NoRoleIcons`, `BetterRoleDot` |
| **Privacy** | 30 | `NoTrack`, `ClearURLs`, `SilentTyping`, `AnonymiseFileNames`, `SuppressReadReceipts`, `NoAnalyticsBeacons`, `RedactJwtTokens`, `RedactEmails`, `InvidiousLinks`, `CleanAmazonLinks` |
| **Utility** | 18 | `AlwaysTrust`, `NSFWGateBypass`, `RelationshipNotifier`, `ShowAttachmentAltText`, `QuickMathEval`, `OldRedditLinks`, `BreezeWikiLinks`, `SmartQuotes` |
| **Developer** | 15 | `DeveloperMode`, `Experiments`, `BypassSlowmodeDisplay`, `UnixTimestamps`, `SnowflakeIdsInChat`, `Base64EncodeMacro`, `HexEncodeMacro`, `AutoCodeBlock` |
| **Nitro** | 9 | `FakeNitro`, `AlwaysAnimate`, `NoGifAutoplay`, `ForceNitroVisuals`, `UnlockClientThemes`, `UnlockBurstChecks`, `HidePremiumUpsells` |
| **Voice** | 5 | `FakeDeafen`, `VoiceMuteOnJoin`, `VoiceDeafenOnJoin`, `VoiceUnmuteOnLeave`, `VoiceChannelAudit` |
| **Core** | 2 | `NekocordBanner`, `NekocordSettingsUI` |

Browse the complete catalog in [PLUGINS.md](docs/PLUGINS.md), or open **User Settings > Nekocord** inside the app.

## Installation

### Option 1: GitHub Releases (Recommended)

1. Download `nekocord-v1.0.0-arm64-v8a.apks` from [GitHub Releases](https://github.com/flufstails/nekocord/releases/latest).
2. Install the split APK bundle using SAI, ZArchiver, or MT Manager (or extract the `.apks` archive and install over ADB):
   ```sh
   adb install-multiple *.apk
   ```
3. Open **User Settings > Nekocord** (or **Plugins** / **Themes**) inside Discord.

> [!TIP]
> Because default builds use `com.discord`, uninstall stock Discord first if upgrading from an unmodified Play Store installation. For updates between Nekocord releases, use **Check for Updates** in-app to pull new runtime JS bundles straight from `flufstails/nekocord`.

### Option 2: Build From Source

**Prerequisites:** Node.js 20+, JDK 11+, Python 3, Android SDK (`build-tools` and `platforms`, auto-detected via `ANDROID_HOME` or `ANDROID_SDK_ROOT`), `apktool.jar` (via `APKTOOL_JAR` or `~/apktool/apktool.jar`), and stock Discord split APKs placed in `apk/`.

```sh
npm install
npm run typecheck
npm run patch
```

Signed split APKs are written to `out/` and archived as `dist/nekocord-v1.0.0-arm64-v8a.apks`.

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
