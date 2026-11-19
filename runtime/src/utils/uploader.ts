import { interceptFluxDispatcher, onHttpClient } from '../metro/common.js';
import { findByProps, getModule, waitFor } from '../metro/index.js';
import { before, type Unpatch } from '../patcher/index.js';

export interface OutgoingUploadItem {
  filename: string;
  mimeType: string;
  spoiler: boolean;
  channelId: string;
  size: number;
  raw: Record<string, any>;
  setFilename(nextName: string): void;
  setSpoiler(flag: boolean): void;
}

export type OutgoingUploadHandler = (
  item: OutgoingUploadItem,
  context: { stage: 'flux' | 'cloudUpload' | 'httpAttachments' | 'legacyUploadFiles'; parsedMessage?: any },
) => boolean | void;

const ATTACHMENTS_POST_RE = /^\/?channels\/([^/?]+)\/attachments(?:$|\?)/;

const UPLOAD_FLUX_TYPES = new Set([
  'UPLOAD_ATTACHMENT_ADD_FILES',
  'UPLOAD_ATTACHMENT_SET_FILE',
  'UPLOAD_ATTACHMENT_SET_UPLOADS',
  'UPLOAD_ATTACHMENT_UPDATE_FILE',
]);

function readItemFilename(raw: any): string {
  if (!raw || typeof raw !== 'object') return '';
  if (typeof raw.filename === 'string' && raw.filename) return raw.filename;
  if (typeof raw.file?.name === 'string' && raw.file.name) return raw.file.name;
  if (typeof raw.name === 'string' && raw.name) return raw.name;
  if (typeof raw.item?.filename === 'string' && raw.item.filename) return raw.item.filename;
  return '';
}

function writeItemFilename(raw: any, nextName: string): void {
  if (!raw || typeof raw !== 'object' || !nextName) return;
  if (typeof raw.setFilename === 'function') {
    try {
      raw.setFilename(nextName);
    } catch {
      raw.filename = nextName;
    }
  } else if ('filename' in raw || typeof raw.filename === 'string') {
    raw.filename = nextName;
  } else {
    raw.filename = nextName;
  }
  if (raw.file && typeof raw.file === 'object' && typeof raw.file.name === 'string') {
    raw.file.name = nextName;
  }
  if (raw.item && typeof raw.item === 'object' && typeof raw.item.filename === 'string') {
    raw.item.filename = nextName;
  }
  if (typeof raw.name === 'string') {
    raw.name = nextName;
  }
}

function wrapUploadItem(
  raw: Record<string, any>,
  channelId: string,
  onMutate?: () => void,
): OutgoingUploadItem {
  const size =
    Number(
      raw.currentSize ??
        raw.preCompressionSize ??
        raw.file_size ??
        raw.size ??
        raw.file?.size ??
        raw.item?.size ??
        0,
    ) || 0;
  const mimeType = String(
    raw.mimeType ??
      raw.file?.mimeType ??
      raw.file?.type ??
      raw.item?.mimeType ??
      raw.item?.type ??
      raw.content_type ??
      raw.type ??
      '',
  );
  return {
    get filename() {
      return readItemFilename(raw);
    },
    get mimeType() {
      return mimeType;
    },
    get spoiler() {
      return Boolean(raw.spoiler);
    },
    channelId,
    size,
    raw,
    setFilename(nextName: string) {
      onMutate?.();
      writeItemFilename(raw, nextName);
    },
    setSpoiler(flag: boolean) {
      onMutate?.();
      raw.spoiler = Boolean(flag);
      if (raw.item && typeof raw.item === 'object') {
        raw.item.spoiler = Boolean(flag);
      }
    },
  };
}

function isCloudUploadClass(m: any): boolean {
  return (
    typeof m === 'function' &&
    (m.name === 'CloudUpload' ||
      typeof m.tryConvertToWebP === 'function' ||
      (typeof m.fromJson === 'function' && typeof m.prototype?.uploadFileToCloud === 'function'))
  );
}

/**
 * Hooks Android attachment staging ({@code UPLOAD_ATTACHMENT_*}), {@code CloudUpload} instances,
 * {@code HTTP.post(/channels/:id/attachments)}, and legacy {@code uploadFiles} calls cleanly.
 */
export function patchOutgoingUploads(handler: OutgoingUploadHandler): () => void {
  const cleanups: Array<() => void> = [];
  const seenObjects = new WeakSet<object>();
  const seenIdentityKeys = new Map<string, number>();
  const handledOutputNames = new Map<string, number>();
  let active = true;

  const getIdentityKey = (raw: any, channelId: string): string | null => {
    const id = raw?.id ?? raw?.uniqueId ?? raw?.uri ?? raw?.originalUri;
    return id ? `${channelId}:${String(id)}` : null;
  };

  const hasSeenIdentity = (raw: any, channelId: string): boolean => {
    const key = getIdentityKey(raw, channelId);
    if (!key) return false;
    const exp = seenIdentityKeys.get(key);
    return exp !== undefined && exp > Date.now();
  };

  const markIdentity = (raw: any, channelId: string): void => {
    const key = getIdentityKey(raw, channelId);
    if (!key) return;
    const now = Date.now();
    if (seenIdentityKeys.size > 120) {
      for (const [k, v] of seenIdentityKeys) {
        if (v <= now) seenIdentityKeys.delete(k);
      }
    }
    seenIdentityKeys.set(key, now + 30000);
  };

  const rememberOutputName = (channelId: string, name: string) => {
    if (!name) return;
    const now = Date.now();
    if (handledOutputNames.size > 120) {
      for (const [k, v] of handledOutputNames) {
        if (v <= now) handledOutputNames.delete(k);
      }
    }
    handledOutputNames.set(`${channelId}:${name}`, now + 60000);
  };

  const wasOutputHandled = (channelId: string, name: string): boolean => {
    if (!name) return false;
    const exp = handledOutputNames.get(`${channelId}:${name}`);
    return exp !== undefined && exp > Date.now();
  };

  const invokeOnce = (
    raw: any,
    channelId: string,
    stage: 'flux' | 'cloudUpload' | 'httpAttachments' | 'legacyUploadFiles',
    parsedMessage?: any,
  ) => {
    if (!active || !raw || typeof raw !== 'object') return;
    if (seenObjects.has(raw)) return;
    if (stage === 'httpAttachments') {
      const curName = readItemFilename(raw);
      if (wasOutputHandled(channelId, curName)) return;
    } else if (hasSeenIdentity(raw, channelId)) {
      return;
    }
    try {
      let mutated = false;
      const wrapped = wrapUploadItem(raw, channelId, () => {
        mutated = true;
      });
      const res = handler(wrapped, { stage, parsedMessage });
      if (mutated || res === true) {
        seenObjects.add(raw);
        if (stage !== 'httpAttachments') {
          markIdentity(raw, channelId);
        }
        rememberOutputName(channelId, readItemFilename(raw));
      }
    } catch (err) {
      console.error('[Nekocord/Uploader] Upload handler error:', err);
    }
  };

  cleanups.push(
    interceptFluxDispatcher((action, args, orig) => {
      if (UPLOAD_FLUX_TYPES.has(action.type)) {
        const chId = String(action.channelId ?? '');
        if (Array.isArray(action.files)) {
          for (let i = 0; i < action.files.length; i += 1) {
            invokeOnce(action.files[i], chId, 'flux');
          }
        }
        if (Array.isArray(action.uploads)) {
          for (let i = 0; i < action.uploads.length; i += 1) {
            invokeOnce(action.uploads[i], chId, 'flux');
          }
        }
        if (action.file && typeof action.file === 'object') {
          invokeOnce(action.file, chId, 'flux');
        }
      }
      return orig(...args);
    }),
  );

  const patchCloudUpload = (CloudUpload: any) => {
    if (!active || !CloudUpload?.prototype) return;
    for (const method of ['reactNativeCompressAndExtractData', 'upload', 'uploadFileToCloud'] as const) {
      if (typeof CloudUpload.prototype[method] !== 'function') continue;
      const u: Unpatch = before(CloudUpload.prototype, method, function (this: any) {
        invokeOnce(this, String(this?.channelId ?? ''), 'cloudUpload');
      });
      cleanups.push(u);
    }
  };

  const existingCloudUpload = getModule(isCloudUploadClass);
  if (existingCloudUpload) {
    patchCloudUpload(existingCloudUpload);
  } else {
    cleanups.push(waitFor(isCloudUploadClass, patchCloudUpload));
  }

  cleanups.push(
    onHttpClient((http: any) => {
      if (!active || typeof http?.post !== 'function') return;
      cleanups.push(
        before(http, 'post', (req: any) => {
          if (!req || typeof req !== 'object' || typeof req.url !== 'string') return;
          const m = ATTACHMENTS_POST_RE.exec(req.url);
          if (!m || !Array.isArray(req.body?.files)) return;
          const chId = m[1];
          for (let i = 0; i < req.body.files.length; i += 1) {
            const f = req.body.files[i];
            if (!f || typeof f !== 'object') continue;
            // Re-run only if not already handled in flux/CloudUpload; match filename via httpAttachments stage.
            invokeOnce(f, chId, 'httpAttachments');
          }
        }),
      );
    }),
  );

  const patchLegacyUploader = (mod: any) => {
    if (!active || !mod || typeof mod.uploadFiles !== 'function') return;
    const u: Unpatch = before(mod, 'uploadFiles', (...args: any[]) => {
      const first = args[0];
      const list = Array.isArray(first)
        ? first
        : first && typeof first === 'object' && Array.isArray(first.uploads)
          ? first.uploads
          : first && typeof first === 'object' && Array.isArray(first.files)
            ? first.files
            : [];
      const chId = String(first?.channelId ?? '');
      const parsedMessage = first && !Array.isArray(first) ? first.parsedMessage : undefined;
      for (let i = 0; i < list.length; i += 1) {
        invokeOnce(list[i], chId, 'legacyUploadFiles', parsedMessage);
      }
    });
    cleanups.push(u);
  };

  const existingLegacy = findByProps('uploadFiles');
  if (existingLegacy) {
    patchLegacyUploader(existingLegacy);
  } else {
    cleanups.push(
      waitFor(
        (m) => typeof m === 'object' && m !== null && typeof m.uploadFiles === 'function',
        patchLegacyUploader,
      ),
    );
  }

  return () => {
    active = false;
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
    seenIdentityKeys.clear();
    handledOutputNames.clear();
  };
}
