import { findByProps, waitFor } from '../../metro/index.js';
import { before, type Unpatch } from '../../patcher/index.js';
import { definePluginSettings, OptionType } from '../settings.js';
import { definePlugin } from '../types.js';

const settings = definePluginSettings({
  includeImages: {
    type: OptionType.BOOLEAN,
    label: 'Spoiler Image Uploads',
    description: 'Automatically mark uploaded image files (.png, .jpg, .webp, .gif) as spoilers.',
    default: true,
  },
  includeVideos: {
    type: OptionType.BOOLEAN,
    label: 'Spoiler Video Uploads',
    description: 'Automatically mark uploaded video files (.mp4, .mov, .webm) as spoilers.',
    default: true,
  },
  includeOtherFiles: {
    type: OptionType.BOOLEAN,
    label: 'Spoiler Other File Types',
    description: 'Also mark documents, archives, and audio uploads as spoilers.',
    default: false,
  },
});

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|bmp|heic|avif)$/i;
const VIDEO_EXT_RE = /\.(mp4|mov|webm|mkv|avi)$/i;

let cancelWait: (() => void) | null = null;
let unpatchUpload: Unpatch | null = null;

function shouldSpoilerFile(name: string): boolean {
  if (!name || name.indexOf('SPOILER_') === 0) {
    return false;
  }
  if (IMAGE_EXT_RE.test(name)) {
    return Boolean(settings.store.includeImages);
  }
  if (VIDEO_EXT_RE.test(name)) {
    return Boolean(settings.store.includeVideos);
  }
  return Boolean(settings.store.includeOtherFiles);
}

function spoilerUploadList(items: unknown[]): void {
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i] as Record<string, any> | undefined;
    if (!item || typeof item !== 'object') {
      continue;
    }
    const rawName =
      typeof item.filename === 'string'
        ? item.filename
        : typeof item.file?.name === 'string'
          ? item.file.name
          : typeof item.name === 'string'
            ? item.name
            : '';
    if (!shouldSpoilerFile(rawName)) {
      continue;
    }
    const nextName = `SPOILER_${rawName}`;
    if (typeof item.filename === 'string') {
      item.filename = nextName;
    }
    if (item.file && typeof item.file === 'object' && typeof item.file.name === 'string') {
      item.file.name = nextName;
    }
    if (typeof item.name === 'string') {
      item.name = nextName;
    }
    if ('spoiler' in item) {
      item.spoiler = true;
    }
  }
}

export default definePlugin({
  settings,
  start() {
    const patchUploader = (mod: any) => {
      if (unpatchUpload || typeof mod?.uploadFiles !== 'function') {
        return;
      }
      unpatchUpload = before(mod, 'uploadFiles', (...args: any[]) => {
        if (Array.isArray(args[0])) {
          spoilerUploadList(args[0]);
        } else if (args[0] && typeof args[0] === 'object' && Array.isArray(args[0].uploads)) {
          spoilerUploadList(args[0].uploads);
        }
      });
    };

    const existing = findByProps('uploadFiles');
    if (existing) {
      patchUploader(existing);
    } else {
      cancelWait = waitFor(
        (m) => typeof m === 'object' && m !== null && typeof m.uploadFiles === 'function',
        patchUploader,
      );
    }
  },
  stop() {
    if (cancelWait) {
      cancelWait();
      cancelWait = null;
    }
    if (unpatchUpload) {
      unpatchUpload();
      unpatchUpload = null;
    }
  },
});
