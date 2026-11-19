type AnyFn = (...args: any[]) => any;

export type Unpatch = () => void;

interface PatchRecord {
  original: AnyFn;
  originalDescriptor?: PropertyDescriptor;
  before: Set<(...args: any[]) => void>;
  after: Set<(args: any[], res: any) => any>;
  instead: Set<(args: any[], orig: AnyFn) => any>;
  beforeList: Array<(...args: any[]) => void>;
  afterList: Array<(args: any[], res: any) => any>;
  insteadList: Array<(args: any[], orig: AnyFn) => any>;
}

const PATCH_META = new WeakMap<AnyFn, PatchRecord>();
const activeUnpatches = new Set<Unpatch>();

function assignPatchedMethod<T extends object, K extends keyof T>(
  target: T,
  method: K,
  value: AnyFn,
): void {
  const desc = Object.getOwnPropertyDescriptor(target, method);
  if (desc && !('value' in desc) && desc.configurable) {
    Object.defineProperty(target, method, {
      configurable: true,
      enumerable: desc.enumerable ?? true,
      writable: true,
      value,
    });
    return;
  }
  (target as Record<PropertyKey, unknown>)[method] = value;
}

function syncRecordLists(record: PatchRecord): void {
  record.beforeList = Array.from(record.before);
  record.afterList = Array.from(record.after);
  record.insteadList = Array.from(record.instead);
}

function ensurePatched<T extends object, K extends keyof T>(target: T, method: K): PatchRecord {
  const current = target[method];
  if (typeof current !== 'function') {
    throw new TypeError(`[Nekocord/Patcher] Property "${String(method)}" is not a function`);
  }

  const existing = PATCH_META.get(current as AnyFn);
  if (existing) {
    return existing;
  }

  const desc = Object.getOwnPropertyDescriptor(target, method);
  const original = current as AnyFn;
  const record: PatchRecord = {
    original,
    originalDescriptor: desc && !('value' in desc) ? desc : undefined,
    before: new Set(),
    after: new Set(),
    instead: new Set(),
    beforeList: [],
    afterList: [],
    insteadList: [],
  };

  const wrapper = function nekocordPatchWrapper(this: unknown, ...args: any[]) {
    const beforeList = record.beforeList;
    for (let i = 0; i < beforeList.length; i += 1) {
      try {
        beforeList[i].apply(this, args);
      } catch (err) {
        console.error(`[Nekocord/Patcher] before(${String(method)}) error:`, err);
      }
    }

    let result: any;
    const insteadList = record.insteadList;
    const insteadCount = insteadList.length;
    if (insteadCount === 0) {
      result = original.apply(this, args);
    } else if (insteadCount === 1) {
      const self = this;
      result = insteadList[0].call(self, args, (...nextArgs: any[]) => original.apply(self, nextArgs));
    } else {
      const self = this;
      const invokeInstead = (idx: number, innerArgs: any[]): any => {
        if (idx < 0) {
          return original.apply(self, innerArgs);
        }
        return insteadList[idx].call(self, innerArgs, (...nextArgs: any[]) =>
          invokeInstead(idx - 1, nextArgs),
        );
      };
      result = invokeInstead(insteadCount - 1, args);
    }

    const afterList = record.afterList;
    for (let i = 0; i < afterList.length; i += 1) {
      try {
        const nextResult = afterList[i].call(this, args, result);
        if (nextResult !== undefined) {
          result = nextResult;
        }
      } catch (err) {
        console.error(`[Nekocord/Patcher] after(${String(method)}) error:`, err);
      }
    }

    return result;
  };

  Object.defineProperties(wrapper, Object.getOwnPropertyDescriptors(original));
  PATCH_META.set(wrapper, record);
  assignPatchedMethod(target, method, wrapper);
  return record;
}

function registerHook<T extends object, K extends keyof T, C>(
  target: T,
  method: K,
  bucketSelector: (record: PatchRecord) => Set<C>,
  callback: C,
): Unpatch {
  const record = ensurePatched(target, method);
  const bucket = bucketSelector(record);
  bucket.add(callback);
  syncRecordLists(record);

  const unpatch: Unpatch = () => {
    bucket.delete(callback);
    syncRecordLists(record);
    activeUnpatches.delete(unpatch);
    if (
      record.before.size === 0 &&
      record.after.size === 0 &&
      record.instead.size === 0 &&
      PATCH_META.has(target[method] as AnyFn)
    ) {
      if (record.originalDescriptor) {
        Object.defineProperty(target, method, record.originalDescriptor);
      } else {
        (target as Record<PropertyKey, unknown>)[method] = record.original;
      }
    }
  };

  activeUnpatches.add(unpatch);
  return unpatch;
}

/**
 * Runs a callback before the target method executes.
 */
export function before<T extends object, K extends keyof T>(
  target: T,
  method: K,
  callback: (...args: any[]) => void,
): Unpatch {
  return registerHook(target, method, (r) => r.before, callback);
}

/**
 * Runs a callback after the target method executes; returning a defined value replaces the result.
 */
export function after<T extends object, K extends keyof T>(
  target: T,
  method: K,
  callback: (args: any[], res: any) => any,
): Unpatch {
  return registerHook(target, method, (r) => r.after, callback);
}

/**
 * Replaces the target method while providing the original implementation as the second argument.
 */
export function instead<T extends object, K extends keyof T>(
  target: T,
  method: K,
  callback: (args: any[], orig: AnyFn) => any,
): Unpatch {
  return registerHook(target, method, (r) => r.instead, callback);
}

/**
 * Restores every method patched through Nekocord.
 */
export function unpatchAll(): void {
  for (const unpatch of Array.from(activeUnpatches)) {
    unpatch();
  }
}
