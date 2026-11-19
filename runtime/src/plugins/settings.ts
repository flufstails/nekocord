import {
  getPluginSettingValue,
  resetPluginSettings,
  setPluginSettingValue,
} from '../storage/index.js';

export const OptionType = {
  BOOLEAN: 0,
  STRING: 1,
  NUMBER: 2,
  SELECT: 3,
} as const;

export type OptionTypeValue = (typeof OptionType)[keyof typeof OptionType];

export interface BaseSettingOption<T> {
  label?: string;
  description: string;
  default: T;
  restartNeeded?: boolean;
  hidden?: boolean;
}

export interface BooleanSettingOption extends BaseSettingOption<boolean> {
  type: typeof OptionType.BOOLEAN;
}

export interface StringSettingOption extends BaseSettingOption<string> {
  type: typeof OptionType.STRING;
  placeholder?: string;
}

export interface NumberSettingOption extends BaseSettingOption<number> {
  type: typeof OptionType.NUMBER;
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectOptionItem<V extends string | number = string | number> {
  label: string;
  value: V;
}

export interface SelectSettingOption<V extends string | number = string | number>
  extends BaseSettingOption<V> {
  type: typeof OptionType.SELECT;
  options: ReadonlyArray<SelectOptionItem<V>>;
}

export type PluginSettingDef =
  | BooleanSettingOption
  | StringSettingOption
  | NumberSettingOption
  | SelectSettingOption<any>;

export type SettingsDefinition = Record<string, PluginSettingDef>;

export type SettingsStoreType<D extends SettingsDefinition> = {
  [K in keyof D]: D[K]['default'];
};

export interface DefinedPluginSettings<D extends SettingsDefinition = SettingsDefinition> {
  readonly def: D;
  readonly store: SettingsStoreType<D>;
  get<K extends keyof D & string>(key: K): D[K]['default'];
  set<K extends keyof D & string>(key: K, value: D[K]['default']): void;
  reset(): void;
  _bindPluginName(name: string): void;
}

function clampNumericOption(opt: NumberSettingOption, raw: unknown): number {
  const num = typeof raw === 'number' && Number.isFinite(raw) ? raw : opt.default;
  let bounded = num;
  if (typeof opt.min === 'number' && bounded < opt.min) {
    bounded = opt.min;
  }
  if (typeof opt.max === 'number' && bounded > opt.max) {
    bounded = opt.max;
  }
  return bounded;
}

/**
 * Defines typed Vencord-style plugin settings backed by Nekocord persistent storage.
 */
export function definePluginSettings<D extends SettingsDefinition>(
  def: D,
): DefinedPluginSettings<D> {
  let boundPluginName = '';

  const getVal = <K extends keyof D & string>(key: K): D[K]['default'] => {
    const opt: PluginSettingDef = def[key];
    const fallback = opt.default;
    if (!boundPluginName) {
      return fallback as D[K]['default'];
    }
    const stored = getPluginSettingValue<unknown>(boundPluginName, key, fallback);
    if (opt.type === OptionType.BOOLEAN) {
      return (typeof stored === 'boolean' ? stored : opt.default) as D[K]['default'];
    }
    if (opt.type === OptionType.NUMBER) {
      return clampNumericOption(opt, stored) as D[K]['default'];
    }
    if (opt.type === OptionType.STRING) {
      return (typeof stored === 'string' ? stored : opt.default) as D[K]['default'];
    }
    if (opt.type === OptionType.SELECT) {
      const valid = opt.options.some((item) => item.value === stored);
      return (valid ? stored : opt.default) as D[K]['default'];
    }
    return fallback as D[K]['default'];
  };

  const setVal = <K extends keyof D & string>(key: K, value: D[K]['default']): void => {
    const opt = def[key];
    let normalized: unknown = value;
    if (opt.type === OptionType.BOOLEAN) {
      normalized = Boolean(value);
    } else if (opt.type === OptionType.NUMBER) {
      normalized = clampNumericOption(opt, value);
    } else if (opt.type === OptionType.STRING) {
      normalized = typeof value === 'string' ? value : String(value ?? '');
    } else if (opt.type === OptionType.SELECT) {
      const valid = opt.options.some((item) => item.value === value);
      normalized = valid ? value : opt.default;
    }
    if (boundPluginName) {
      setPluginSettingValue(boundPluginName, key, normalized);
    }
  };

  const store = {} as SettingsStoreType<D>;
  for (const key of Object.keys(def) as Array<keyof D & string>) {
    Object.defineProperty(store, key, {
      enumerable: true,
      configurable: true,
      get: () => getVal(key),
      set: (val: D[typeof key]['default']) => setVal(key, val),
    });
  }

  return {
    def,
    store,
    get: getVal,
    set: setVal,
    reset() {
      if (boundPluginName) {
        resetPluginSettings(boundPluginName);
      }
    },
    _bindPluginName(name: string) {
      boundPluginName = name;
    },
  };
}

/**
 * Formats a camelCase setting key into a readable title when no explicit label is provided.
 */
export function formatSettingLabel(key: string, explicit?: string): string {
  if (explicit && explicit.trim()) {
    return explicit.trim();
  }
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : key;
}

/**
 * Reports whether a plugin declares any user-visible configuration options.
 */
export function hasVisiblePluginSettings(plugin: {
  settings?: DefinedPluginSettings<any>;
}): boolean {
  const def = plugin.settings?.def;
  if (!def) {
    return false;
  }
  const keys = Object.keys(def);
  for (let i = 0; i < keys.length; i += 1) {
    if (!def[keys[i]].hidden) {
      return true;
    }
  }
  return false;
}
