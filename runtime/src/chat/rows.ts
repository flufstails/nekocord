import { getReactNative } from '../metro/common.js';
import { findByProps, waitFor } from '../metro/index.js';
import { instead, type Unpatch } from '../patcher/index.js';

/**
 * Mutates an individual Discord {@code MessageRow} payload in place before it is
 * serialized across the bridge to native {@code ChatModule}. Returning {@code true}
 * triggers re-serialization of {@code rowsJSON}.
 */
export type MessageRowTransformer = (row: Record<string, any>) => boolean;

const transformers = new Set<MessageRowTransformer>();
let transformerList: MessageRowTransformer[] = [];
let installed = false;
let observedUpdateRows = false;
let fallbackPatched = false;
let cancelFallbackWait: (() => void) | null = null;
let unpatchFallback: Unpatch | null = null;

function getPreloadState() {
  return globalThis.__NEKOCORD_PRELOAD__ ?? globalThis.__PURRCORD_PRELOAD__ ?? null;
}

/**
 * Converts ARGB byte components (0-255) into a signed 32-bit integer required by
 * Android's {@code kotlinx.serialization} {@code Int} decoder.
 */
export function toAndroidColor(a: number, r: number, g: number, b: number): number {
  return ((a & 0xff) << 24) | ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

function processUpdateRowsArgs(args: any[]): void {
  if (!observedUpdateRows) {
    observedUpdateRows = true;
    console.log('[Nekocord/ChatRows] Intercepted NativeChatModule.updateRows');
  }

  const list = transformerList;
  if (list.length === 0 || !args || typeof args[1] !== 'string') {
    return;
  }

  let rows: unknown;
  try {
    rows = JSON.parse(args[1]);
  } catch (err) {
    console.error('[Nekocord/ChatRows] Failed to parse rowsJSON:', err);
    return;
  }

  if (!Array.isArray(rows)) {
    return;
  }

  let mutated = false;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (
      !row ||
      typeof row !== 'object' ||
      (row.type !== 1 && row.type !== '1') ||
      !row.message ||
      typeof row.message !== 'object' ||
      !row.message.id
    ) {
      continue;
    }

    for (let t = 0; t < list.length; t += 1) {
      try {
        if (list[t](row)) {
          mutated = true;
        }
      } catch (err) {
        console.error('[Nekocord/ChatRows] Transformer error:', err);
      }
    }
  }

  if (mutated) {
    args[1] = JSON.stringify(rows);
  }
}

function tryPatchFallbackModule(mod: any): boolean {
  const preload = getPreloadState();
  if (
    fallbackPatched ||
    preload?.hookedChatModule ||
    !mod ||
    typeof mod.updateRows !== 'function'
  ) {
    return false;
  }
  try {
    unpatchFallback = instead(mod, 'updateRows', (callArgs, orig) => {
      processUpdateRowsArgs(callArgs);
      return orig(...callArgs);
    });
    fallbackPatched = true;
    return true;
  } catch {
    return false;
  }
}

function ensureInstalled(): void {
  if (installed) {
    return;
  }
  installed = true;

  const preload = getPreloadState();
  if (preload) {
    preload.chatUpdateRowsHook = processUpdateRowsArgs;
  }

  if (!preload?.hookedChatModule) {
    let nativeMod: any;
    try {
      nativeMod = getReactNative()?.NativeModules?.NativeChatModule;
    } catch {
      nativeMod = undefined;
    }
    const existing = findByProps('updateRows', 'clearRows') ?? nativeMod;
    if (!tryPatchFallbackModule(existing)) {
      cancelFallbackWait = waitFor(
        (m) =>
          typeof m === 'object' &&
          m !== null &&
          typeof m.updateRows === 'function' &&
          typeof m.clearRows === 'function' &&
          typeof m.registerComponent !== 'function',
        (mod) => {
          tryPatchFallbackModule(mod);
        },
      );
    }
  }
}

/**
 * Registers a transformer executed on each {@code MessageRow} passed to {@code ChatModule.updateRows}.
 */
export function registerMessageRowTransformer(fn: MessageRowTransformer): () => void {
  ensureInstalled();
  transformers.add(fn);
  transformerList = Array.from(transformers);
  return () => {
    transformers.delete(fn);
    transformerList = Array.from(transformers);
    if (transformers.size === 0) {
      if (cancelFallbackWait) {
        cancelFallbackWait();
        cancelFallbackWait = null;
      }
      if (unpatchFallback) {
        unpatchFallback();
        unpatchFallback = null;
        fallbackPatched = false;
      }
      installed = false;
      const preload = getPreloadState();
      if (preload?.chatUpdateRowsHook === processUpdateRowsArgs) {
        preload.chatUpdateRowsHook = null;
      }
    }
  };
}

/**
 * Reports whether native {@code NativeChatModule.updateRows} interception is active.
 */
export function isChatRowHookReady(): boolean {
  return (
    Boolean(getPreloadState()?.hookedChatModule) ||
    observedUpdateRows ||
    fallbackPatched
  );
}
