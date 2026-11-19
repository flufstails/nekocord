import { findByProps, findByStoreName, getModule, getTurboModule, waitFor } from './index.js';

export interface NativeCacheModule {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export interface NativeClipboardModule {
  setItem(text: string, a?: string, b?: string): void;
}

export interface NativeFileModule {
  writeFile(storageDir: string, path: string, data: string, encoding: string): Promise<any>;
  readFile?(path: string, encoding: string): Promise<string>;
  fileExists?(path: string): Promise<boolean>;
}

export interface FluxDispatcher {
  dispatch(action: Record<string, any>): void;
  subscribe(type: string, cb: (event: any) => void): void;
  unsubscribe(type: string, cb: (event: any) => void): void;
  _interceptors?: Array<(action: Record<string, any>) => boolean | void>;
  _actionHandlers?: Record<string, any>;
}

export interface MessageActionCreators {
  sendMessage(channelId: string, message: Record<string, any>, ...rest: any[]): any;
  editMessage(channelId: string, messageId: string, message: Record<string, any>, ...rest: any[]): any;
  deleteMessage?(channelId: string, messageId: string, ...rest: any[]): any;
  sendStickers?(channelId: string, stickerIds: string[], ...rest: any[]): any;
}

let cachedReact: any;
let cachedReactNative: any;
let cachedDispatcher: FluxDispatcher | undefined;
let cachedMessageActions: MessageActionCreators | undefined;
let cachedMessageStore: any;
let cachedUserStore: any;
let cachedChannelStore: any;
let cachedRelationshipStore: any;
let cachedThemeStore: any;

function isClassInstance(m: unknown): m is Record<string, any> {
  if (m == null || typeof m !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(m);
  return proto != null && proto !== Object.prototype && proto !== Array.prototype;
}

export function isReactModule(mod: any): boolean {
  return (
    typeof mod?.createElement === 'function' &&
    typeof mod?.useState === 'function' &&
    typeof mod?.useEffect === 'function' &&
    typeof mod?.useMemo === 'function' &&
    typeof mod?.useRef === 'function' &&
    mod?.Fragment != null
  );
}

export function isReactNativeModule(mod: any): boolean {
  return (
    mod?.View != null &&
    mod?.Text != null &&
    mod?.ScrollView != null &&
    mod?.Pressable != null &&
    mod?.Switch != null &&
    mod?.Modal != null &&
    typeof mod?.StyleSheet?.create === 'function' &&
    typeof mod?.AppRegistry?.registerComponent === 'function'
  );
}

export function isFluxDispatcher(mod: any): mod is FluxDispatcher {
  return (
    mod != null &&
    typeof mod === 'object' &&
    typeof mod.dispatch === 'function' &&
    typeof mod.subscribe === 'function' &&
    typeof mod.unsubscribe === 'function' &&
    mod._actionHandlers != null &&
    Array.isArray(mod._interceptors)
  );
}

export function getReact(): any {
  if (!cachedReact) {
    cachedReact = findByProps('createElement', 'useState', 'useEffect', 'useMemo', 'useRef', 'Fragment');
  }
  return cachedReact;
}

export function getReactNative(): any {
  if (!cachedReactNative) {
    cachedReactNative = findByProps(
      'View',
      'Text',
      'ScrollView',
      'Pressable',
      'Switch',
      'Modal',
      'StyleSheet',
      'AppRegistry',
    );
  }
  return cachedReactNative;
}

export function getFluxDispatcher(): FluxDispatcher | undefined {
  if (!cachedDispatcher) {
    cachedDispatcher = getModule<FluxDispatcher>(isFluxDispatcher);
  }
  return cachedDispatcher;
}

export function getStore<T = any>(name: string): T | undefined {
  return findByStoreName<T>(name);
}

export function getMessageStore<T = any>(): T | undefined {
  if (!cachedMessageStore) {
    cachedMessageStore =
      findByStoreName<T>('MessageStore') ??
      getModule<T>(
        (m) =>
          isClassInstance(m) &&
          typeof m.getMessage === 'function' &&
          typeof m.getMessages === 'function',
      );
  }
  return cachedMessageStore as T | undefined;
}

export function getUserStore<T = any>(): T | undefined {
  if (!cachedUserStore) {
    cachedUserStore =
      findByStoreName<T>('UserStore') ??
      getModule<T>(
        (m) =>
          isClassInstance(m) &&
          typeof m.getCurrentUser === 'function' &&
          typeof m.getUser === 'function',
      );
  }
  return cachedUserStore as T | undefined;
}

export function getChannelStore<T = any>(): T | undefined {
  if (!cachedChannelStore) {
    cachedChannelStore =
      findByStoreName<T>('ChannelStore') ??
      getModule<T>(
        (m) =>
          isClassInstance(m) &&
          typeof m.getChannel === 'function' &&
          typeof m.getDMFromUserId === 'function',
      );
  }
  return cachedChannelStore as T | undefined;
}

export function getRelationshipStore<T = any>(): T | undefined {
  if (!cachedRelationshipStore) {
    cachedRelationshipStore =
      findByStoreName<T>('RelationshipStore') ??
      getModule<T>(
        (m) =>
          isClassInstance(m) &&
          typeof m.isBlocked === 'function' &&
          typeof m.isIgnored === 'function',
      );
  }
  return cachedRelationshipStore as T | undefined;
}

export function getThemeStore<T = any>(): T | undefined {
  if (!cachedThemeStore) {
    cachedThemeStore =
      findByStoreName<T>('ThemeStore') ??
      getModule<T>(
        (m) =>
          isClassInstance(m) &&
          typeof m.theme === 'string' &&
          typeof m.addChangeListener === 'function',
      );
  }
  return cachedThemeStore as T | undefined;
}

export function isMessageActions(mod: any): mod is MessageActionCreators {
  return (
    mod != null &&
    typeof mod === 'object' &&
    typeof mod.sendMessage === 'function' &&
    typeof mod.editMessage === 'function'
  );
}

export function getMessageActions(): MessageActionCreators | undefined {
  if (!cachedMessageActions) {
    cachedMessageActions = findByProps<MessageActionCreators>('sendMessage', 'editMessage');
  }
  return cachedMessageActions;
}

export function onMessageActions(callback: (actions: MessageActionCreators) => void): () => void {
  const existing = getMessageActions();
  if (existing) {
    callback(existing);
    return () => {};
  }
  return waitFor<MessageActionCreators>(isMessageActions, (actions) => {
    cachedMessageActions = actions;
    callback(actions);
  });
}

export function getCacheModule(): NativeCacheModule | undefined {
  return getTurboModule<NativeCacheModule>('NativeCacheModule');
}

export function getClipboardModule(): NativeClipboardModule | undefined {
  return getTurboModule<NativeClipboardModule>('NativeCommandClipboardModule');
}

export function getFileModule(): NativeFileModule | undefined {
  const rn = getReactNative();
  const candidates = [
    getTurboModule<NativeFileModule>('NativeFileModule'),
    rn?.TurboModuleRegistry?.get?.('NativeFileModule'),
    rn?.NativeModules?.NativeFileModule,
    rn?.NativeModules?.DCDFileManager,
  ];
  for (let i = 0; i < candidates.length; i += 1) {
    const mod = candidates[i];
    if (mod && typeof mod.writeFile === 'function') {
      return mod;
    }
  }
  return undefined;
}

export function restartDiscordApp(): boolean {
  const rn = getReactNative();
  const candidates = [
    rn?.NativeModules?.BundleUpdaterManager,
    getTurboModule<Record<string, any>>('BundleUpdaterManager'),
    rn?.NativeModules?.DevSettings,
    getTurboModule<Record<string, any>>('DevSettings'),
  ];
  for (let i = 0; i < candidates.length; i += 1) {
    const mod = candidates[i];
    if (mod && typeof mod.reload === 'function') {
      mod.reload();
      return true;
    }
  }
  return false;
}

export function onFluxDispatcher(callback: (dispatcher: FluxDispatcher) => void): () => void {
  const existing = getFluxDispatcher();
  if (existing) {
    callback(existing);
    return () => {};
  }
  return waitFor<FluxDispatcher>(isFluxDispatcher, (dispatcher) => {
    cachedDispatcher = dispatcher;
    callback(dispatcher);
  });
}

export function onReactAndNative(callback: (React: any, ReactNative: any) => void): () => void {
  let reactMod = getReact();
  let rnMod = getReactNative();
  let triggered = false;
  let cancelReact = () => {};
  let cancelRn = () => {};

  const maybeNotify = () => {
    if (!triggered && reactMod && rnMod) {
      triggered = true;
      callback(reactMod, rnMod);
    }
  };

  if (!reactMod) {
    cancelReact = waitFor(isReactModule, (mod) => {
      cachedReact = mod;
      reactMod = mod;
      maybeNotify();
    });
  }

  if (!rnMod) {
    cancelRn = waitFor(isReactNativeModule, (mod) => {
      cachedReactNative = mod;
      rnMod = mod;
      maybeNotify();
    });
  }

  maybeNotify();

  return () => {
    cancelReact();
    cancelRn();
  };
}
