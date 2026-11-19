import { registerMessageRowTransformer } from '../../chat/rows.js';
import { definePlugin } from '../types.js';

let unregisterRowTransformer: (() => void) | null = null;
let revealedCount = 0;

function unwrapSpoilerNodes(nodes: any[]): { next: any[]; count: number } {
  const next: any[] = [];
  let count = 0;

  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!node || typeof node !== 'object') {
      next.push(node);
      continue;
    }

    if (node.type === 'spoiler' && Array.isArray(node.content)) {
      const inner = unwrapSpoilerNodes(node.content);
      for (let j = 0; j < inner.next.length; j += 1) {
        next.push(inner.next[j]);
      }
      count += 1 + inner.count;
      continue;
    }

    if (Array.isArray(node.content)) {
      const inner = unwrapSpoilerNodes(node.content);
      if (inner.count > 0) {
        next.push({ ...node, content: inner.next });
        count += inner.count;
      } else {
        next.push(node);
      }
      continue;
    }

    next.push(node);
  }

  return { next, count };
}

function revealRowSpoilers(row: Record<string, any>): boolean {
  const msg = row.message;
  if (!msg || typeof msg !== 'object') {
    return false;
  }

  let changed = false;

  if (Array.isArray(msg.content)) {
    const unwrapped = unwrapSpoilerNodes(msg.content);
    if (unwrapped.count > 0) {
      msg.content = unwrapped.next;
      revealedCount += unwrapped.count;
      changed = true;
    }
  }

  if (Array.isArray(msg.attachments)) {
    for (let i = 0; i < msg.attachments.length; i += 1) {
      const att = msg.attachments[i];
      if (
        att &&
        typeof att === 'object' &&
        (att.isSpoiler === true || Boolean(att.spoiler) || Boolean(att.spoilerOrNull))
      ) {
        att.isSpoiler = false;
        delete att.spoiler;
        delete att.spoilerOrNull;
        revealedCount += 1;
        changed = true;
      }
    }
  }

  return changed;
}

export default definePlugin({
  start() {
    unregisterRowTransformer = registerMessageRowTransformer(revealRowSpoilers);
  },

  stop() {
    if (unregisterRowTransformer) {
      unregisterRowTransformer();
      unregisterRowTransformer = null;
    }
  },
});
