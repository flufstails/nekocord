import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rewriteArscPackage, rewriteManifestPackage } from './axml.mjs';
import { pickLatestSubdir, resolveToolchain, runTool } from './build-android.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const opts = {
    inputDir: path.join(rootDir, 'apk'),
    outputDir: path.join(rootDir, 'out'),
    packageName: 'com.discord',
    install: false,
    serial: null,
    skipBuild: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--input' && argv[i + 1]) {
      opts.inputDir = path.resolve(argv[++i]);
    } else if (arg === '--output' && argv[i + 1]) {
      opts.outputDir = path.resolve(argv[++i]);
    } else if (arg === '--package' && argv[i + 1]) {
      opts.packageName = argv[++i];
    } else if (arg === '--install') {
      opts.install = true;
    } else if (arg === '--serial' && argv[i + 1]) {
      opts.serial = argv[++i];
    } else if (arg === '--skip-build') {
      opts.skipBuild = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

function ensureKeystore(keystorePath) {
  if (existsSync(keystorePath)) {
    return;
  }
  execFileSync(
    'keytool',
    [
      '-genkeypair',
      '-v',
      '-keystore',
      keystorePath,
      '-storepass',
      'nekocord',
      '-keypass',
      'nekocord',
      '-alias',
      'nekocord',
      '-keyalg',
      'RSA',
      '-keysize',
      '2048',
      '-validity',
      '10000',
      '-dname',
      'CN=Nekocord,O=Nekocord,C=US',
    ],
    { stdio: 'inherit' },
  );
}

function apkHasEntry(apkPath, entryName) {
  try {
    execFileSync(
      'python',
      [
        '-c',
        'import sys,zipfile; sys.exit(0 if sys.argv[2] in zipfile.ZipFile(sys.argv[1]).namelist() else 1)',
        apkPath,
        entryName,
      ],
      { stdio: 'ignore' },
    );
    return true;
  } catch {
    return false;
  }
}

function extractEntry(apkPath, entryName, outPath) {
  execFileSync(
    'python',
    [
      '-c',
      'import sys,zipfile; open(sys.argv[3],"wb").write(zipfile.ZipFile(sys.argv[1]).read(sys.argv[2]))',
      apkPath,
      entryName,
      outPath,
    ],
    { stdio: 'inherit' },
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const pkgJson = JSON.parse(await readFile(path.join(rootDir, 'package.json'), 'utf8'));
  const version = typeof pkgJson.version === 'string' ? pkgJson.version : '1.0.0';

  const { sdkRoot, apktoolJar } = resolveToolchain();
  const buildToolsDir = await pickLatestSubdir(path.join(sdkRoot, 'build-tools'));
  const zipalignExe = path.join(buildToolsDir, process.platform === 'win32' ? 'zipalign.exe' : 'zipalign');
  const apksignerExe = path.join(buildToolsDir, process.platform === 'win32' ? 'apksigner.bat' : 'apksigner');
  const adbExe = path.join(sdkRoot, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');

  if (!opts.skipBuild) {
    execFileSync('node', [path.join(rootDir, 'runtime', 'build.mjs')], { stdio: 'inherit' });
    execFileSync('node', [path.join(__dirname, 'build-android.mjs')], { stdio: 'inherit' });
  }

  const baseApk = path.join(opts.inputDir, 'base.apk');
  if (!existsSync(baseApk)) {
    throw new Error(`base.apk not found in ${opts.inputDir}`);
  }

  const preloadJs = path.join(rootDir, 'dist', 'runtime', 'nekocord-preload.js');
  const runtimeJs = path.join(rootDir, 'dist', 'runtime', 'nekocord.js');
  const classes4Dex = path.join(rootDir, 'dist', 'android', 'classes4.dex');
  const patcherDir = path.join(rootDir, 'dist', 'patcher');

  await mkdir(opts.outputDir, { recursive: true });
  const workDir = await mkdtemp(path.join(rootDir, 'dist', 'work-'));
  const keystorePath = path.join(rootDir, 'dist', 'nekocord-debug.keystore');
  ensureKeystore(keystorePath);

  try {
    const patchedClassesDex = path.join(workDir, 'classes.dex');
    const smaliTempDir = path.join(workDir, 'smali');

    execFileSync(
      'java',
      ['-cp', `${patcherDir}${path.delimiter}${apktoolJar}`, 'DexPatcher', baseApk, patchedClassesDex, smaliTempDir],
      { stdio: 'inherit' },
    );

    const apkFiles = (await readdir(opts.inputDir))
      .filter((name) => name.endsWith('.apk'))
      .sort((a, b) => (a === 'base.apk' ? -1 : b === 'base.apk' ? 1 : a.localeCompare(b)));

    const signedApks = [];

    for (const apkName of apkFiles) {
      const srcApk = path.join(opts.inputDir, apkName);
      const rawRepacked = path.join(workDir, `raw-${apkName}`);
      const alignedApk = path.join(opts.outputDir, apkName);
      const replace = {};
      const add = {};
      const remove_prefixes = [];

      if (opts.packageName !== 'com.discord') {
        const origManifest = path.join(workDir, `orig-${apkName}-AndroidManifest.xml`);
        const newManifest = path.join(workDir, `patched-${apkName}-AndroidManifest.xml`);
        extractEntry(srcApk, 'AndroidManifest.xml', origManifest);
        const origBuf = await readFile(origManifest);
        const patchedBuf = rewriteManifestPackage(origBuf, opts.packageName, 'com.discord');
        await writeFile(newManifest, patchedBuf);
        replace['AndroidManifest.xml'] = newManifest;

        if (apkHasEntry(srcApk, 'resources.arsc')) {
          const origArsc = path.join(workDir, `orig-${apkName}-resources.arsc`);
          const newArsc = path.join(workDir, `patched-${apkName}-resources.arsc`);
          extractEntry(srcApk, 'resources.arsc', origArsc);
          const origArscBuf = await readFile(origArsc);
          const patchedArscBuf = rewriteArscPackage(origArscBuf, opts.packageName, 'com.discord');
          await writeFile(newArsc, patchedArscBuf);
          replace['resources.arsc'] = newArsc;
        }
      }

      if (apkName === 'base.apk') {
        replace['classes.dex'] = patchedClassesDex;
        add['classes4.dex'] = { path: classes4Dex, stored: false };
        add['assets/nekocord-preload.js'] = { path: preloadJs, stored: false };
        add['assets/nekocord.js'] = { path: runtimeJs, stored: false };
        remove_prefixes.push('assets/dexopt/');
      }

      const specFile = path.join(workDir, `spec-${apkName}.json`);
      await writeFile(specFile, JSON.stringify({ replace, add, remove_prefixes }, null, 2));

      execFileSync(
        'python',
        [path.join(__dirname, 'repack_apk.py'), srcApk, rawRepacked, specFile],
        { stdio: 'inherit' },
      );

      execFileSync(
        zipalignExe,
        ['-f', '-P', '16', '4', rawRepacked, alignedApk],
        { stdio: 'inherit' },
      );

      runTool(apksignerExe, [
        'sign',
        '--ks',
        keystorePath,
        '--ks-pass',
        'pass:nekocord',
        '--key-pass',
        'pass:nekocord',
        '--ks-key-alias',
        'nekocord',
        alignedApk,
      ]);

      const idsig = `${alignedApk}.idsig`;
      await rm(idsig, { force: true });
      signedApks.push(alignedApk);
      console.log(`Signed ${apkName} -> ${alignedApk}`);
    }

    const bundleApksPath = path.join(rootDir, 'dist', `nekocord-v${version}-arm64-v8a.apks`);
    await rm(bundleApksPath, { force: true });
    execFileSync(
      'python',
      [
        '-c',
        'import os,sys,zipfile\nout=sys.argv[1]\nfiles=sys.argv[2:]\nwith zipfile.ZipFile(out,"w",zipfile.ZIP_STORED) as z:\n for f in files: z.write(f,os.path.basename(f))\n',
        bundleApksPath,
        ...signedApks,
      ],
      { stdio: 'inherit' },
    );
    console.log(`Packaged split APKS bundle -> ${bundleApksPath}`);

    if (opts.install) {
      const adbArgs = opts.serial ? ['-s', opts.serial] : [];
      execFileSync(
        adbExe,
        [...adbArgs, 'install-multiple', '-r', '-d', ...signedApks],
        { stdio: 'inherit' },
      );
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

await main();
