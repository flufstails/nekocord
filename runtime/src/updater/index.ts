import { getFileModule, getReactNative } from '../metro/common.js';
import { DEFAULT_UPDATE_SOURCE, getUpdateSource, setUpdateSource } from '../storage/index.js';

export interface UpdateCheckResult {
  status: 'up-to-date' | 'update-available' | 'error';
  currentVersion: string;
  latestVersion?: string;
  bundleUrl?: string;
  preloadUrl?: string;
  releaseUrl?: string;
  notes?: string;
  error?: string;
}

const GITHUB_REPO_RE = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

function parseVersionParts(raw: string): { nums: number[]; pre: string[] } {
  const cleaned = raw.trim().replace(/^v/i, '');
  const [corePart, prePart] = cleaned.split('-', 2);
  const nums = corePart
    .split('.')
    .map((segment) => {
      const n = parseInt(segment, 10);
      return Number.isFinite(n) ? n : 0;
    });
  while (nums.length < 3) {
    nums.push(0);
  }
  const pre = prePart ? prePart.split('.') : [];
  return { nums, pre };
}

function compareVersions(a: string, b: string): number {
  const pa = parseVersionParts(a);
  const pb = parseVersionParts(b);
  const len = Math.max(pa.nums.length, pb.nums.length);
  for (let i = 0; i < len; i += 1) {
    const da = pa.nums[i] ?? 0;
    const db = pb.nums[i] ?? 0;
    if (da !== db) {
      return da > db ? 1 : -1;
    }
  }
  if (pa.pre.length === 0 && pb.pre.length === 0) {
    return 0;
  }
  if (pa.pre.length === 0) {
    return 1;
  }
  if (pb.pre.length === 0) {
    return -1;
  }
  const preLen = Math.max(pa.pre.length, pb.pre.length);
  for (let i = 0; i < preLen; i += 1) {
    const sa = pa.pre[i];
    const sb = pb.pre[i];
    if (sa === undefined) return -1;
    if (sb === undefined) return 1;
    const na = /^\d+$/.test(sa) ? parseInt(sa, 10) : NaN;
    const nb = /^\d+$/.test(sb) ? parseInt(sb, 10) : NaN;
    if (!Number.isNaN(na) && !Number.isNaN(nb)) {
      if (na !== nb) return na > nb ? 1 : -1;
    } else if (sa !== sb) {
      return sa > sb ? 1 : -1;
    }
  }
  return 0;
}

function getCurrentVersion(): string {
  return globalThis.Nekocord?.version ?? '1.1.0';
}

/**
 * Checks a configured GitHub owner/repo, manifest JSON URL, or bundle URL for updates.
 */
export async function checkForUpdates(sourceInput?: string): Promise<UpdateCheckResult> {
  const currentVersion = getCurrentVersion();
  const source = ((sourceInput !== undefined ? sourceInput : getUpdateSource()) || DEFAULT_UPDATE_SOURCE).trim();

  if (!source) {
    return {
      status: 'error',
      currentVersion,
      error: 'Enter a GitHub owner/repo or manifest URL first.',
    };
  }

  setUpdateSource(source);

  const fetchFn = (globalThis as Record<string, any>).fetch as
    | ((input: string, init?: any) => Promise<any>)
    | undefined;
  if (typeof fetchFn !== 'function') {
    return {
      status: 'error',
      currentVersion,
      error: 'Fetch API is unavailable in this session.',
    };
  }

  try {
    if (GITHUB_REPO_RE.test(source)) {
      const apiUrl = `https://api.github.com/repos/${source}/releases/latest`;
      const res = await fetchFn(apiUrl, {
        headers: { Accept: 'application/vnd.github+json' },
      });
      if (!res.ok) {
        return {
          status: 'error',
          currentVersion,
          error: `GitHub API returned HTTP ${res.status}.`,
        };
      }
      const data = (await res.json()) as Record<string, any>;
      const tag = typeof data?.tag_name === 'string' ? data.tag_name : '';
      const latestVersion = tag.replace(/^v/i, '') || currentVersion;
      const assets = Array.isArray(data?.assets) ? data.assets : [];
      const bundleAsset = assets.find(
        (a: any) =>
          a?.name === 'nekocord.js' ||
          a?.name === 'nekocord.bundle.js' ||
          a?.name === 'purrcord.js',
      );
      const preloadAsset = assets.find(
        (a: any) => a?.name === 'nekocord-preload.js' || a?.name === 'purrcord-preload.js',
      );
      const newer = tag ? compareVersions(latestVersion, currentVersion) > 0 : false;
      return {
        status: newer ? 'update-available' : 'up-to-date',
        currentVersion,
        latestVersion,
        bundleUrl: typeof bundleAsset?.browser_download_url === 'string' ? bundleAsset.browser_download_url : undefined,
        preloadUrl: typeof preloadAsset?.browser_download_url === 'string' ? preloadAsset.browser_download_url : undefined,
        releaseUrl:
          typeof data?.html_url === 'string'
            ? data.html_url
            : `https://github.com/${source}/releases`,
        notes: typeof data?.body === 'string' ? data.body.slice(0, 280) : undefined,
      };
    }

    if (!/^https?:\/\/\S+$/i.test(source)) {
      return {
        status: 'error',
        currentVersion,
        error: 'Use owner/repo shorthand or an https:// manifest/bundle URL.',
      };
    }

    if (/\.js(\?.*)?$/i.test(source)) {
      return {
        status: 'update-available',
        currentVersion,
        latestVersion: currentVersion,
        bundleUrl: source,
        releaseUrl: source,
        notes: 'Direct JS bundle URL ready to download and install.',
      };
    }

    const res = await fetchFn(source);
    if (!res.ok) {
      return {
        status: 'error',
        currentVersion,
        error: `Manifest request failed with HTTP ${res.status}.`,
      };
    }
    const manifest = (await res.json()) as Record<string, any>;
    if (!manifest || typeof manifest !== 'object' || typeof manifest.version !== 'string') {
      return {
        status: 'error',
        currentVersion,
        error: 'Update manifest JSON is missing a valid "version" string.',
      };
    }

    const latestVersion = manifest.version.replace(/^v/i, '').trim();
    const bundleUrl = typeof manifest.bundleUrl === 'string' ? manifest.bundleUrl : undefined;
    const preloadUrl = typeof manifest.preloadUrl === 'string' ? manifest.preloadUrl : undefined;
    const releaseUrl = typeof manifest.releaseUrl === 'string' ? manifest.releaseUrl : source;
    const newer = compareVersions(latestVersion, currentVersion) > 0;

    return {
      status: newer ? 'update-available' : 'up-to-date',
      currentVersion,
      latestVersion,
      bundleUrl,
      preloadUrl,
      releaseUrl,
      notes: typeof manifest.notes === 'string' ? manifest.notes.slice(0, 280) : undefined,
    };
  } catch (err) {
    return {
      status: 'error',
      currentVersion,
      error: err instanceof Error ? err.message : 'Update check failed.',
    };
  }
}

/**
 * Downloads runtime JS bundle files from {@code result} and writes dev override files on device.
 */
export async function applyRuntimeUpdate(
  result: UpdateCheckResult,
): Promise<{ ok: boolean; message: string }> {
  if (!result.bundleUrl) {
    return {
      ok: false,
      message: 'This release has no direct JS bundle asset; open the release page to download an APK update.',
    };
  }
  const fileMod = getFileModule();
  if (!fileMod || typeof fileMod.writeFile !== 'function') {
    return {
      ok: false,
      message: 'NativeFileModule is unavailable in this build.',
    };
  }
  const fetchFn = (globalThis as Record<string, any>).fetch as
    | ((input: string, init?: any) => Promise<any>)
    | undefined;
  if (typeof fetchFn !== 'function') {
    return {
      ok: false,
      message: 'Fetch API is unavailable in this session.',
    };
  }

  try {
    const bundleRes = await fetchFn(result.bundleUrl);
    if (!bundleRes.ok) {
      return { ok: false, message: `Bundle download failed (HTTP ${bundleRes.status}).` };
    }
    const bundleText = await bundleRes.text();
    if (!bundleText || bundleText.length < 500 || bundleText.trimStart().startsWith('<')) {
      return { ok: false, message: 'Downloaded bundle file looks invalid.' };
    }

    await fileMod.writeFile('documents', 'nekocord/nekocord.dev.js', bundleText, 'utf8');

    if (result.preloadUrl) {
      const preloadRes = await fetchFn(result.preloadUrl);
      if (preloadRes.ok) {
        const preloadText = await preloadRes.text();
        if (preloadText && preloadText.length >= 200 && !preloadText.trimStart().startsWith('<')) {
          await fileMod.writeFile('documents', 'nekocord/nekocord-preload.dev.js', preloadText, 'utf8');
        }
      }
    }

    return {
      ok: true,
      message: `Installed runtime v${result.latestVersion ?? result.currentVersion}. Restart Discord to apply.`,
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Failed to install runtime update.',
    };
  }
}

/**
 * Opens an external release URL using React Native's Linking API.
 */
export function openReleasePage(url: string): boolean {
  const linking = getReactNative()?.Linking;
  if (linking && typeof linking.openURL === 'function' && /^https?:\/\//i.test(url)) {
    linking.openURL(url);
    return true;
  }
  return false;
}
