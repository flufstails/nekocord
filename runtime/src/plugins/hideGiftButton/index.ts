import { getReact } from '../../metro/common.js';
import { type ComponentPatchTarget, watchNamedExports } from '../../metro/index.js';
import { after, instead, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const GIFT_TARGET_NAMES = new Set([
  'shouldShowGiftButton',
  'ChatInputActionButtonGift',
  'ChatInputActionButtonGiftOrThread',
  'renderChatInputActionButtonGiftAndThread',
  'PremiumAnimatedGiftButton',
  'GiftIconTrinketsAnimation',
  'ChatInputActionButton',
  'ChatInputActions',
]);

const GIFT_WORD_RE = /gift/i;
const THREAD_WORD_RE = /thread/i;

const unpatches: Unpatch[] = [];
const hookedNames = new Set<string>();
let cancelWatch: (() => void) | null = null;
let suppressedCount = 0;

function getElementTypeName(type: any): string {
  if (!type) {
    return '';
  }
  const candidates = [
    type.displayName,
    type.name,
    type.type?.displayName,
    type.type?.name,
    type.render?.displayName,
    type.render?.name,
  ];
  for (let i = 0; i < candidates.length; i += 1) {
    if (typeof candidates[i] === 'string' && candidates[i]) {
      return candidates[i];
    }
  }
  return '';
}

function isConcreteGiftName(name: string): boolean {
  if (!name) {
    return false;
  }
  if (
    name === 'ChatInputActionButtonGift' ||
    name === 'PremiumAnimatedGiftButton' ||
    name === 'GiftIcon' ||
    name === 'GiftIconTrinketsAnimation'
  ) {
    return true;
  }
  return GIFT_WORD_RE.test(name) && !THREAD_WORD_RE.test(name);
}

function isGiftButtonProps(props: any): boolean {
  if (!props || typeof props !== 'object') {
    return false;
  }
  const stringProps = [
    props.accessibilityLabel,
    props.accessibilityHint,
    props.testID,
    props.actionType,
    props.name,
    props.id,
  ];
  for (let i = 0; i < stringProps.length; i += 1) {
    const val = stringProps[i];
    if (typeof val === 'string') {
      if (THREAD_WORD_RE.test(val) && !GIFT_WORD_RE.test(val)) {
        return false;
      }
      if (GIFT_WORD_RE.test(val) && !THREAD_WORD_RE.test(val)) {
        return true;
      }
    }
  }
  const icon = props.icon;
  if (typeof icon === 'string' && GIFT_WORD_RE.test(icon) && !THREAD_WORD_RE.test(icon)) {
    return true;
  }
  if (icon && isConcreteGiftName(getElementTypeName(icon))) {
    return true;
  }
  return false;
}

function isGiftElement(node: any, depth = 0): boolean {
  if (node == null || depth > 4) {
    return false;
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) {
      if (isGiftElement(node[i], depth)) {
        return true;
      }
    }
    return false;
  }
  if (typeof node !== 'object') {
    return false;
  }

  const typeName = getElementTypeName(node.type);
  if (isConcreteGiftName(typeName)) {
    return true;
  }
  if (THREAD_WORD_RE.test(typeName) && !GIFT_WORD_RE.test(typeName)) {
    return false;
  }

  const props = node.props;
  if (props && typeof props === 'object') {
    if (isGiftButtonProps(props)) {
      return true;
    }
    const stringProps = [props.accessibilityLabel, props.testID, props.actionType];
    for (let i = 0; i < stringProps.length; i += 1) {
      const val = stringProps[i];
      if (typeof val === 'string' && THREAD_WORD_RE.test(val) && !GIFT_WORD_RE.test(val)) {
        return false;
      }
    }
    if (props.children !== undefined && depth < 4) {
      return isGiftElement(props.children, depth + 1);
    }
  }

  return false;
}

function pruneGiftChildren(node: any, React: any, depth = 0): { next: any; removed: number } {
  if (node == null || typeof node !== 'object' || depth > 5 || !React?.cloneElement) {
    return { next: node, removed: 0 };
  }
  const props = node.props;
  if (!props || typeof props !== 'object' || props.children === undefined) {
    return { next: node, removed: 0 };
  }

  const children = props.children;
  if (Array.isArray(children)) {
    let removed = 0;
    let mutated = false;
    const nextChildren: any[] = [];
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      if (isGiftElement(child)) {
        removed += 1;
        mutated = true;
        continue;
      }
      const sub = pruneGiftChildren(child, React, depth + 1);
      if (sub.removed > 0) {
        removed += sub.removed;
        mutated = true;
      }
      nextChildren.push(sub.next);
    }
    if (!mutated) {
      return { next: node, removed: 0 };
    }
    return { next: React.cloneElement(node, { children: nextChildren }), removed };
  }

  if (isGiftElement(children)) {
    return { next: React.cloneElement(node, { children: null }), removed: 1 };
  }

  const sub = pruneGiftChildren(children, React, depth + 1);
  if (sub.removed > 0) {
    return { next: React.cloneElement(node, { children: sub.next }), removed: sub.removed };
  }
  return { next: node, removed: 0 };
}

function applyGiftPatch(hit: ComponentPatchTarget): void {
  try {
    let unpatch: Unpatch;
    switch (hit.matchedName) {
      case 'shouldShowGiftButton':
        unpatch = instead(hit.target, hit.key, () => {
          suppressedCount += 1;
          return false;
        });
        break;
      case 'ChatInputActionButtonGift':
      case 'PremiumAnimatedGiftButton':
      case 'GiftIconTrinketsAnimation':
        unpatch = after(hit.target, hit.key, () => {
          suppressedCount += 1;
          return null;
        });
        break;
      case 'renderChatInputActionButtonGiftAndThread':
      case 'ChatInputActionButtonGiftOrThread':
        unpatch = after(hit.target, hit.key, (_args: any[], res: any) => {
          if (isGiftElement(res)) {
            suppressedCount += 1;
            return null;
          }
          return res;
        });
        break;
      case 'ChatInputActionButton':
        unpatch = after(hit.target, hit.key, (args: any[], res: any) => {
          if (isGiftButtonProps(args[0]) || isGiftElement(res)) {
            suppressedCount += 1;
            return null;
          }
          return res;
        });
        break;
      case 'ChatInputActions':
        unpatch = after(hit.target, hit.key, (_args: any[], res: any) => {
          if (!res || typeof res !== 'object') {
            return res;
          }
          const pruned = pruneGiftChildren(res, getReact());
          if (pruned.removed > 0) {
            suppressedCount += pruned.removed;
            return pruned.next;
          }
          return res;
        });
        break;
      default:
        return;
    }

    unpatches.push(unpatch);
    hookedNames.add(hit.matchedName);
    console.log(`[Nekocord/HideGiftButton] Hooked ${hit.matchedName} (key=${hit.key})`);
  } catch (err) {
    console.error(`[Nekocord/HideGiftButton] Failed to hook ${hit.matchedName}:`, err);
  }
}

export default definePlugin({
  start() {
    cancelWatch = watchNamedExports(GIFT_TARGET_NAMES, applyGiftPatch);
  },

  stop() {
    if (cancelWatch) {
      cancelWatch();
      cancelWatch = null;
    }
    while (unpatches.length > 0) {
      const fn = unpatches.pop();
      fn?.();
    }
    hookedNames.clear();
  },
});
