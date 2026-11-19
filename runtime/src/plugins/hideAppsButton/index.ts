import { getReact } from '../../metro/common.js';
import { type ComponentPatchTarget, watchNamedExports } from '../../metro/index.js';
import { after, type Unpatch } from '../../patcher/index.js';
import { definePlugin } from '../types.js';

const APPS_TARGET_NAMES = new Set(['ChatInputActionButtonApps', 'ChatInputActions']);
const APPS_WORD_RE = /app(?:s|_?launcher)?|command/i;

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

function isAppsElement(node: any, depth = 0): boolean {
  if (node == null || depth > 4) {
    return false;
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) {
      if (isAppsElement(node[i], depth)) {
        return true;
      }
    }
    return false;
  }
  if (typeof node !== 'object') {
    return false;
  }

  const typeName = getElementTypeName(node.type);
  if (typeName === 'ChatInputActionButtonApps') {
    return true;
  }
  if (/gift|thread|emoji|media|attach|voice/i.test(typeName)) {
    return false;
  }

  const props = node.props;
  if (props && typeof props === 'object') {
    for (const val of [props.testID, props.accessibilityLabel, props.actionType, props.name, props.id]) {
      if (typeof val === 'string') {
        if (/gift|thread/i.test(val)) {
          return false;
        }
        if (APPS_WORD_RE.test(val) && /app|launcher/i.test(val)) {
          return true;
        }
      }
    }
    if (props.children !== undefined && depth < 4) {
      return isAppsElement(props.children, depth + 1);
    }
  }

  return false;
}

function pruneAppsChildren(node: any, React: any, depth = 0): { next: any; removed: number } {
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
      if (isAppsElement(child)) {
        removed += 1;
        mutated = true;
        continue;
      }
      const sub = pruneAppsChildren(child, React, depth + 1);
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

  if (isAppsElement(children)) {
    return { next: React.cloneElement(node, { children: null }), removed: 1 };
  }

  const sub = pruneAppsChildren(children, React, depth + 1);
  if (sub.removed > 0) {
    return { next: React.cloneElement(node, { children: sub.next }), removed: sub.removed };
  }
  return { next: node, removed: 0 };
}

function applyAppsPatch(hit: ComponentPatchTarget): void {
  try {
    let unpatch: Unpatch;
    if (hit.matchedName === 'ChatInputActionButtonApps') {
      unpatch = after(hit.target, hit.key, () => {
        suppressedCount += 1;
        return null;
      });
    } else if (hit.matchedName === 'ChatInputActions') {
      unpatch = after(hit.target, hit.key, (_args: any[], res: any) => {
        if (!res || typeof res !== 'object') {
          return res;
        }
        const pruned = pruneAppsChildren(res, getReact());
        if (pruned.removed > 0) {
          suppressedCount += pruned.removed;
          return pruned.next;
        }
        return res;
      });
    } else {
      return;
    }

    unpatches.push(unpatch);
    hookedNames.add(hit.matchedName);
  } catch (err) {
    console.error(`[Nekocord/HideAppsButton] Failed to hook ${hit.matchedName}:`, err);
  }
}

export default definePlugin({
  start() {
    cancelWatch = watchNamedExports(APPS_TARGET_NAMES, applyAppsPatch);
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
