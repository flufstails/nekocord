# How to Make a Nekocord Plugin

Each built-in Nekocord plugin lives in its own directory under `runtime/src/plugins/<slug>/` with two required files:

- `README.md`: YAML frontmatter metadata and Markdown documentation shown inside the in-app Plugin detail screen and generated into [PLUGINS.md](PLUGINS.md).
- `index.ts`: Default export created with `definePlugin(...)` that registers hooks in `start()` and removes every hook in `stop()`.

The build script `runtime/scripts/generate-plugins.mjs` discovers every directory under `runtime/src/plugins/` (skipping directories prefixed with `_`, such as `_shared/`) and generates `runtime/src/plugins/registry.generated.ts`.

---

## 1. Create the Plugin Directory

Use a concise `camelCase` directory slug matching your plugin's behavior (for example `runtime/src/plugins/myCustomPlugin/`):

```text
runtime/src/plugins/myCustomPlugin/
  index.ts
  README.md
```

---

## 2. Define Metadata in `README.md`

Every `README.md` must begin with a valid YAML frontmatter block. `name`, `description`, `authors`, and `category` are required.

```yaml
---
name: MyCustomPlugin
description: Short one-sentence summary displayed on the plugin card.
authors:
  - name: flufstails
    icon: https://avatars.githubusercontent.com/u/244251958?v=4
    github: flufstails
category: chat
enabledByDefault: false
requiresRestart: false
isNew: true
tags:
  - formatting
  - utility
---

# MyCustomPlugin

Longer Markdown documentation rendered inside the plugin detail modal.

- Supports headings (`#`, `##`, `###`) and bullet lists (`-` or `*`).
- Keep descriptions concise and accurate for mobile reading.
```

### Frontmatter Field Reference

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | Unique PascalCase plugin identifier shown in Settings and UI search. |
| `description` | `string` | Yes | Single-line summary displayed on the plugin card and generated catalog. |
| `authors` | `Array<string \| { name, icon?, github? }>` | Yes | Non-empty author list. Supply `icon` with an `https://` avatar URL so the Plugins modal renders an author avatar chip, and optional `github` when the GitHub username differs from `name`. |
| `authorIcon` | `string` | No | Top-level fallback avatar URL applied to author entries without an explicit `icon`. |
| `category` | `PluginCategory` | Yes | One of `chat`, `ui`, `privacy`, `utility`, `developer`, `nitro`, `voice`, or `core`. |
| `enabledByDefault` | `boolean` | No | Set `true` only if the plugin should start automatically on fresh installs (default `false`). |
| `requiresRestart` | `boolean` | No | Prompts the user to restart Discord when toggling the plugin (default `false`). |
| `isNew` | `boolean` | No | Displays a `NEW` badge on the plugin card in the Plugins list. |
| `core` | `boolean` | No | Hides internal runtime plugins from user-toggleable plugin counts. Do not set on user plugins. |
| `tags` | `string[]` | No | Search keywords rendered as chips in the plugin modal. |

---

## 3. Implement `index.ts`

Import `definePlugin` from `../types.js` (note the `.js` extension required by TypeScript ESM resolution) and clean up all hooks and timers in `stop()`.

### Minimal Lifecycle Example

```ts
import { onFluxDispatcher } from '../../metro/common.js';
import { instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

let cancelWait: (() => void) | null = null;
let unpatchDispatch: Unpatch | null = null;

export default definePlugin({
  start() {
    cancelWait = onFluxDispatcher((dispatcher) => {
      if (unpatchDispatch) return;
      unpatchDispatch = instead(dispatcher, 'dispatch', (args, orig) => {
        const action = args[0];
        if (action?.type === 'MY_NOISY_EVENT') {
          return undefined;
        }
        return orig(...args);
      });
    });
  },

  stop() {
    cancelWait?.();
    cancelWait = null;
    unpatchDispatch?.();
    unpatchDispatch = null;
  },
});
```

---

## 4. Add Interactive Settings (`definePluginSettings`)

Plugins that export `settings = definePluginSettings(...)` automatically show a cog icon on their card, appear under the `Configurable` filter pill, and render interactive Discord controls in `PluginModal`.

```ts
import { registerMessageRowTransformer } from '../../chat/rows.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  highlightMentions: {
    type: OptionType.BOOLEAN,
    label: 'Highlight Custom Word',
    description: 'Enable highlighting on matching incoming messages.',
    default: true,
  },
  matchText: {
    type: OptionType.STRING,
    label: 'Target Keyword',
    description: 'Case-insensitive keyword to match.',
    placeholder: 'deploy',
    default: 'deploy',
  },
  minLength: {
    type: OptionType.NUMBER,
    label: 'Minimum Characters',
    description: 'Skip messages shorter than this character count.',
    min: 1,
    max: 500,
    default: 8,
  },
  tint: {
    type: OptionType.SELECT,
    label: 'Highlight Preset',
    description: 'Choose the row accent color.',
    options: [
      { label: 'Blurple', value: 'blurple' },
      { label: 'Amber', value: 'amber' },
    ],
    default: 'blurple',
    restartNeeded: false,
  },
});

let unregister: (() => void) | null = null;

export default definePlugin({
  settings,
  start() {
    unregister = registerMessageRowTransformer((row) => {
      if (!settings.store.highlightMentions) return false;
      const msg = row.message;
      if (!msg || typeof msg.content !== 'string') return false;
      if (msg.content.length < settings.store.minLength) return false;
      return false;
    });
  },
  stop() {
    unregister?.();
    unregister = null;
  },
});
```

### Supported `OptionType` Variants

| OptionType | UI Control | Key Properties |
| :--- | :--- | :--- |
| `OptionType.BOOLEAN` | Discord capsule switch | `default: boolean`, `restartNeeded?: boolean` |
| `OptionType.STRING` | Text input field | `default: string`, `placeholder?: string` |
| `OptionType.NUMBER` | Numeric input with `-` / `+` steppers | `default: number`, `min?: number`, `max?: number`, `step?: number` |
| `OptionType.SELECT` | Selectable option chips | `default: string \| number`, `options: ReadonlyArray<{ label, value }>` |

---

## 5. Runtime APIs and Shared Helpers

Reuse existing runtime utilities and `_shared` helpers instead of duplicating traversal or patching boilerplate.

### Metro & Patcher (`runtime/src/metro/` and `runtime/src/patcher/`)

- `findByProps(...props)`, `findByStoreName(storeName)`, `findByName(name)`, `findByDisplayName(displayName)`, `getModule(filter)`
- `waitFor(filter, callback)` and `waitForStore(storeName, callback)` (always store and call the returned cancel function in `stop()`)
- `watchNamedExports(targetSet, onHit)` (shares one Metro watcher across plugins)
- `before(target, key, fn)`, `after(target, key, fn)`, `instead(target, key, fn)` returning `Unpatch`
- `onFluxDispatcher(cb)`, `onMessageActions(cb)`, `getUserStore()`, `getChannelStore()`, `getMessageStore()`, `getRelationshipStore()`, `getThemeStore()`

### Chat & Shared Helpers

- `runtime/src/chat/rows.ts`: `registerMessageRowTransformer(fn)` and `toAndroidColor(a, r, g, b)`
- `runtime/src/utils/text.ts`: `patchOutgoingMessageContent(fn)`, `transformOutsideCode(content, fn)`, `transformOutsideCodeAndTokens(content, fn)`
- `runtime/src/plugins/_shared/chatDisplay.ts`: `createRowPlugin`, `extractMessageText`, `messageContainsText`, `appendTimestampNote`, `snowflakeToEpochMs`, `clearProp`, `ROW_COLOURS`
- `runtime/src/plugins/_shared/chatUtility.ts`: `createUtilityPlugin`
- `runtime/src/plugins/_shared/linkAndEmbed.ts`: `createUrlTransformPlugin`, `replaceDomain`
- `runtime/src/plugins/_shared/fluxAndPrivacy.ts`: `createDispatcherBlockerPlugin`, `createDispatcherInterceptorPlugin`, `createNamedOverridePlugin`, `createZeroStoreMethodPlugin`, `createVoiceActionOnSelectPlugin`

---

## 6. Build and Test Your Plugin

Run the code generator, typechecker, and runtime bundler from the repository root:

```sh
npm run gen:plugins
npm run typecheck
npm run build:runtime
```

To test changes directly on a rooted or debug-enabled device over ADB without rebuilding the APK:

```sh
npm run push:dev -- --serial <device-serial>
```

To build a full patched split APK bundle:

```sh
npm run patch
```

---

## 7. Constraints Checklist

- **Hermes ES2018 target:** Do not use `BigInt` literals (`123n`), `String.prototype.replaceAll`, `Array.prototype.at`, or `Object.hasOwn`. `runtime/build.mjs` targets `['es2018']`.
- **Clean teardown:** Unsubscribe every dispatcher listener, cancel every `waitFor` handle, and invoke every `Unpatch` inside `stop()`.
- **Fail safely:** Wrap optional store or native bridge property accesses in defensive type checks because Discord internals change between app versions.
