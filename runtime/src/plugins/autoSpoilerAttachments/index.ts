import { patchOutgoingUploads } from '../../utils/uploader.js';
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

let unpatchUploads: (() => void) | null = null;

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

export default definePlugin({
  settings,
  start() {
    if (unpatchUploads) return;
    unpatchUploads = patchOutgoingUploads((item) => {
      if (item.raw?.isVoiceMessage || item.filename === 'voice-message.ogg') {
        return;
      }
      if (!shouldSpoilerFile(item.filename)) {
        return;
      }
      item.setFilename(`SPOILER_${item.filename}`);
      item.setSpoiler(true);
    });
  },

  stop() {
    unpatchUploads?.();
    unpatchUploads = null;
  },
});
