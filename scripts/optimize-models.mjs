#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const publicDir = path.join(repoRoot, 'public');
const outputBase = path.join(publicDir, 'optimized');

const useDraco = process.argv.includes('--draco');

const BINARIES = {
  gltfTransform: path.join(repoRoot, 'node_modules', '.bin', 'gltf-transform'),
  gltfPipeline: path.join(repoRoot, 'node_modules', '.bin', 'gltf-pipeline'),
};

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (fullPath === outputBase) continue; // skip optimized output
      yield* walk(fullPath);
    } else if (entry.isFile()) {
      if (/\.(glb|gltf)$/i.test(entry.name)) {
        yield fullPath;
      }
    }
  }
}

async function statOrNull(p) {
  try {
    return await fs.stat(p);
  } catch {
    return null;
  }
}

function toOptimizedPath(inputPath) {
  const rel = path.relative(publicDir, inputPath);
  const outRel = rel.replace(/\.(gltf)$/i, '.glb'); // convert .gltf -> .glb
  return path.join(outputBase, outRel);
}

async function runGltfTransform(input, output) {
  const args = ['optimize', input, output];
  await execFileAsync(BINARIES.gltfTransform, args, { stdio: 'inherit' });
}

async function runGltfPipelineDraco(input, output) {
  // Force .glb output for draco path
  const out = output.replace(/\.(gltf)$/i, '.glb');
  const args = ['-i', input, '-o', out, '-d'];
  await execFileAsync(BINARIES.gltfPipeline, args, { stdio: 'inherit' });
}

function prettySize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let i = -1;
  do {
    bytes = bytes / 1024;
    i++;
  } while (bytes >= 1024 && i < units.length - 1);
  return `${bytes.toFixed(2)} ${units[i]}`;
}

async function optimizeOne(inputPath) {
  const outputPath = toOptimizedPath(inputPath);
  await ensureDir(path.dirname(outputPath));

  const srcStat = await fs.stat(inputPath);
  const dstStat = await statOrNull(outputPath);
  if (dstStat && dstStat.mtimeMs >= srcStat.mtimeMs) {
    console.log(`↷ Skipping up-to-date: ${path.relative(publicDir, inputPath)}`);
    return { skipped: true };
  }

  const before = srcStat.size;
  if (useDraco) {
    await runGltfPipelineDraco(inputPath, outputPath);
  } else {
    await runGltfTransform(inputPath, outputPath);
  }
  const afterStat = await fs.stat(outputPath);
  const after = afterStat.size;
  const delta = after - before;
  const pct = ((1 - after / before) * 100).toFixed(1);
  console.log(`✓ Optimized ${path.relative(publicDir, inputPath)} → ${path.relative(publicDir, outputPath)} (${prettySize(before)} → ${prettySize(after)}, ${pct}% smaller)`);
  return { before, after };
}

async function main() {
  // Sanity checks
  const pubExists = await statOrNull(publicDir);
  if (!pubExists) {
    console.error('public/ directory not found. Place your .glb/.gltf files under public/.');
    process.exit(1);
  }

  const toolName = useDraco ? 'gltf-pipeline (Draco)' : 'gltf-transform optimize';
  console.log(`Model optimization starting with ${toolName}...`);
  console.log(`Scanning: ${publicDir}`);

  let count = 0;
  let totalBefore = 0;
  let totalAfter = 0;

  for await (const inputPath of walk(publicDir)) {
    // Avoid re-optimizing outputs
    if (inputPath.startsWith(outputBase)) continue;
    const res = await optimizeOne(inputPath);
    if (!res?.skipped) {
      count++;
      totalBefore += res.before || 0;
      totalAfter += res.after || 0;
    }
  }

  if (count === 0) {
    console.log('No models optimized. Either none were found, or all were up-to-date.');
  } else {
    const pct = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
    console.log(`Done. Optimized ${count} file(s). Total: ${prettySize(totalBefore)} → ${prettySize(totalAfter)} (${pct}% smaller).`);
  }

  console.log(`Output saved under: ${outputBase}`);
  if (useDraco) {
    console.log('Note: Draco-compressed models require GLTFLoader + DracoLoader on the client.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
