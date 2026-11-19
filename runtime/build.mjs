import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generatePlugins } from './scripts/generate-plugins.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist', 'runtime');
const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const version = typeof pkg.version === 'string' ? pkg.version : '1.1.0';

const summary = generatePlugins();
await mkdir(outDir, { recursive: true });

await Promise.all([
  build({
    entryPoints: [path.join(__dirname, 'src', 'preload.ts')],
    outfile: path.join(outDir, 'nekocord-preload.js'),
    bundle: true,
    format: 'iife',
    platform: 'neutral',
    target: ['es2018'],
    minify: false,
    legalComments: 'none',
  }),
  build({
    entryPoints: [path.join(__dirname, 'src', 'index.ts')],
    outfile: path.join(outDir, 'nekocord.js'),
    bundle: true,
    format: 'iife',
    platform: 'neutral',
    target: ['es2018'],
    minify: false,
    legalComments: 'none',
  }),
]);

console.log(
  `Built Nekocord v${version} runtime bundles (${summary.total} plugins: ${summary.visible} visible, ${summary.core} core) to ${outDir}`,
);
