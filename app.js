const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const appDir = __dirname;
const logFile = path.join(appDir, 'smgh-error.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(logFile, line);
  console.log(line.trim());
}

function run(cmd, opts = {}) {
  try {
    log(`Running: ${cmd}`);
    const out = execSync(cmd, { cwd: appDir, stdio: 'pipe', timeout: 300000, ...opts });
    log(`OK: ${cmd}`);
    return out.toString();
  } catch (e) {
    log(`FAIL: ${cmd}\n${e.stderr?.toString() || e.stdout?.toString() || e.message}`);
    return null;
  }
}

log('=== SMGH App Starting ===');
log(`Node: ${process.version}`);
log(`PORT: ${process.env.PORT}`);
log(`DIR: ${appDir}`);

// Step 1: Install dependencies if needed
if (!fs.existsSync(path.join(appDir, 'node_modules', 'next'))) {
  log('node_modules missing, running npm install...');
  run('npm install --production');
}

// Step 2: Generate Prisma client if needed
if (!fs.existsSync(path.join(appDir, 'node_modules', '.prisma', 'client'))) {
  log('Prisma client missing, generating...');
  run('npx prisma generate');
}

// Step 3: Copy static assets into standalone (always overwrite)
const standaloneDir = path.join(appDir, '.next', 'standalone');
const standaloneNext = path.join(standaloneDir, '.next');

if (fs.existsSync(standaloneDir)) {
  // Copy .next/static into standalone/.next/static
  const staticSrc = path.join(appDir, '.next', 'static');
  const staticDst = path.join(standaloneNext, 'static');
  if (fs.existsSync(staticSrc)) {
    log('Copying .next/static into standalone...');
    run(`rm -rf ${staticDst}`);
    run(`cp -r ${staticSrc} ${staticDst}`);
  }

  // Copy public/ into standalone/
  const publicSrc = path.join(appDir, 'public');
  const publicDst = path.join(standaloneDir, 'public');
  if (fs.existsSync(publicSrc)) {
    log('Copying public/ into standalone...');
    run(`rm -rf ${publicDst}`);
    run(`cp -r ${publicSrc} ${publicDst}`);
  }
}

// Step 4: Start the standalone server
const serverFile = path.join(standaloneDir, 'server.js');
if (!fs.existsSync(serverFile)) {
  log('ERROR: Standalone build not found at ' + serverFile);
  process.exit(1);
}

log('=== Starting Next.js standalone server ===');
require(serverFile);
