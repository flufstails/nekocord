import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export function runTool(executable, args, options = {}) {
  if (process.platform === 'win32' && /\.(bat|cmd)$/i.test(executable)) {
    return execFileSync('cmd.exe', ['/c', executable, ...args], { stdio: 'inherit', ...options });
  }
  return execFileSync(executable, args, { stdio: 'inherit', ...options });
}

export function resolveToolchain() {
  const sdkCandidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'AndroidSDK'),
    path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk'),
    path.join(os.homedir(), 'Android', 'Sdk'),
    path.join(os.homedir(), 'Library', 'Android', 'sdk'),
  ].filter(Boolean);

  const sdkRoot = sdkCandidates.find((candidate) => existsSync(candidate)) ?? sdkCandidates[0];

  const apktoolCandidates = [
    process.env.APKTOOL_JAR,
    path.join(os.homedir(), 'apktool', 'apktool.jar'),
  ].filter(Boolean);

  const apktoolJar =
    apktoolCandidates.find((candidate) => existsSync(candidate)) ?? apktoolCandidates[0];

  return { sdkRoot, apktoolJar };
}

export async function pickLatestSubdir(parentDir) {
  const entries = await readdir(parentDir, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  if (dirs.length === 0) {
    throw new Error(`No version directories found under ${parentDir}`);
  }
  return path.join(parentDir, dirs[0]);
}

async function main() {
  const { sdkRoot, apktoolJar } = resolveToolchain();
  const buildToolsDir = await pickLatestSubdir(path.join(sdkRoot, 'build-tools'));
  const platformDir = await pickLatestSubdir(path.join(sdkRoot, 'platforms'));
  const androidJar = path.join(platformDir, 'android.jar');
  const d8Exe = path.join(buildToolsDir, process.platform === 'win32' ? 'd8.bat' : 'd8');

  if (!existsSync(androidJar)) {
    throw new Error(`android.jar not found at ${androidJar}`);
  }
  if (!existsSync(apktoolJar)) {
    throw new Error(`apktool.jar not found at ${apktoolJar}`);
  }

  const classesDir = path.join(rootDir, 'dist', 'android', 'classes');
  const androidOutDir = path.join(rootDir, 'dist', 'android');
  const patcherOutDir = path.join(rootDir, 'dist', 'patcher');

  await rm(classesDir, { recursive: true, force: true });
  await mkdir(classesDir, { recursive: true });
  await mkdir(patcherOutDir, { recursive: true });

  const loaderSrc = path.join(
    rootDir,
    'android',
    'src',
    'main',
    'java',
    'com',
    'nekocord',
    'NekocordLoader.java',
  );
  const stubSrc = path.join(
    rootDir,
    'android',
    'stubs',
    'com',
    'facebook',
    'react',
    'bridge',
    'JSBundleLoaderDelegate.java',
  );

  execFileSync(
    'javac',
    ['-Xlint:-options', '-source', '11', '-target', '11', '-cp', androidJar, '-d', classesDir, stubSrc, loaderSrc],
    { stdio: 'inherit' },
  );

  const loaderClass = path.join(classesDir, 'com', 'nekocord', 'NekocordLoader.class');
  runTool(d8Exe, ['--min-api', '24', '--lib', androidJar, '--output', androidOutDir, loaderClass]);

  const classesDex = path.join(androidOutDir, 'classes.dex');
  const classes4Dex = path.join(androidOutDir, 'classes4.dex');
  await rm(classes4Dex, { force: true });
  await rename(classesDex, classes4Dex);

  const dexPatcherSrc = path.join(__dirname, 'DexPatcher.java');
  execFileSync(
    'javac',
    ['--release', '11', '-cp', apktoolJar, '-d', patcherOutDir, dexPatcherSrc],
    { stdio: 'inherit' },
  );

  console.log(`Built Nekocord Android loader (${classes4Dex}) and DexPatcher (${patcherOutDir})`);
}

const isEntrypoint =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  await main();
}
