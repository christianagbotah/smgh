#!/usr/bin/env node
/**
 * Post-build script: copies Prisma engine binaries into the standalone output
 * so they are available at runtime on the deployment server (cPanel shared hosting).
 *
 * Without this, the .next/standalone build will miss the native .node files,
 * causing Prisma to fall back to WebAssembly, which runs out of memory on
 * shared hosting.
 */

const fs = require("fs");
const path = require("path");

const STANDALONE_DIR = path.join(__dirname, "..", ".next", "standalone");
const PRISMA_GENERATED_SRC = path.join(__dirname, "..", "src", "generated", "prisma");

function copyPrismaEngines() {
  console.log("📦 Copying Prisma engine binaries to standalone output...");

  // 1. Copy the entire generated Prisma directory to standalone
  const standalonePrismaDir = path.join(STANDALONE_DIR, "src", "generated", "prisma");

  if (fs.existsSync(PRISMA_GENERATED_SRC)) {
    // Ensure target directory exists
    fs.mkdirSync(standalonePrismaDir, { recursive: true });

    // Copy all files including .node binaries
    const entries = fs.readdirSync(PRISMA_GENERATED_SRC, { withFileTypes: true });
    let copiedCount = 0;

    for (const entry of entries) {
      const srcPath = path.join(PRISMA_GENERATED_SRC, entry.name);
      const destPath = path.join(standalonePrismaDir, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy directories
        copyDirRecursive(srcPath, destPath);
        copiedCount++;
      } else {
        fs.copyFileSync(srcPath, destPath);
        copiedCount++;
      }
    }

    console.log(`✅ Copied ${copiedCount} files/directories to standalone Prisma output`);

    // 2. Also ensure node_modules/@prisma is available in standalone
    // (some Prisma internals may reference it)
    const nodeModulesPrismaSrc = path.join(__dirname, "..", "node_modules", "@prisma");
    const standaloneNodeModulesPrisma = path.join(STANDALONE_DIR, "node_modules", "@prisma");

    if (fs.existsSync(nodeModulesPrismaSrc) && !fs.existsSync(standaloneNodeModulesPrisma)) {
      fs.mkdirSync(standaloneNodeModulesPrisma, { recursive: true });
      const prismaEntries = fs.readdirSync(nodeModulesPrismaSrc, { withFileTypes: true });

      for (const entry of prismaEntries) {
        const srcPath = path.join(nodeModulesPrismaSrc, entry.name);
        const destPath = path.join(standaloneNodeModulesPrisma, entry.name);

        if (entry.isDirectory()) {
          copyDirRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
      console.log("✅ Copied @prisma client runtime to standalone node_modules");
    }

    // 3. Verify engine binaries are present
    const engineFiles = fs.readdirSync(standalonePrismaDir).filter(
      (f) => f.endsWith(".node") || f.endsWith(".wasm")
    );

    if (engineFiles.length > 0) {
      console.log(`🔧 Engine files in standalone output:`);
      engineFiles.forEach((f) => {
        const size = fs.statSync(path.join(standalonePrismaDir, f)).size;
        console.log(`   - ${f} (${(size / 1024 / 1024).toFixed(1)} MB)`);
      });
    } else {
      console.warn("⚠️  No engine binary files found in standalone output! Prisma may fail at runtime.");
    }
  } else {
    console.error("❌ Generated Prisma directory not found:", PRISMA_GENERATED_SRC);
    process.exit(1);
  }
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Run
copyPrismaEngines();
