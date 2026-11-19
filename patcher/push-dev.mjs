import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveToolchain } from './build-android.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const opts = {
    packageName: 'com.discord',
    serial: null,
    skipBuild: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--serial' && argv[i + 1]) {
      opts.serial = argv[++i];
    } else if (arg === '--package' && argv[i + 1]) {
      opts.packageName = argv[++i];
    } else if (arg === '--skip-build') {
      opts.skipBuild = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { sdkRoot } = resolveToolchain();
  const adbExe = path.join(sdkRoot, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');

  if (!existsSync(adbExe)) {
    throw new Error(`adb executable not found at ${adbExe}`);
  }

  if (!opts.skipBuild) {
    execFileSync('node', [path.join(rootDir, 'runtime', 'build.mjs')], { stdio: 'inherit' });
  }

  const preloadOut = path.join(rootDir, 'dist', 'runtime', 'nekocord-preload.js');
  const runtimeOut = path.join(rootDir, 'dist', 'runtime', 'nekocord.js');
  const remoteDir = `/sdcard/Android/data/${opts.packageName}/files/nekocord`;
  const adbPrefix = opts.serial ? ['-s', opts.serial] : [];

  const adb = (args) => execFileSync(adbExe, [...adbPrefix, ...args], { stdio: 'inherit' });

  adb(['shell', 'mkdir', '-p', remoteDir]);
  adb(['push', preloadOut, `${remoteDir}/nekocord-preload.dev.js`]);
  adb(['push', runtimeOut, `${remoteDir}/nekocord.dev.js`]);
  adb(['shell', 'am', 'force-stop', opts.packageName]);
  adb(['shell', 'am', 'start', '-W', '-n', `${opts.packageName}/com.discord.main.MainActivity`]);
}

main();
