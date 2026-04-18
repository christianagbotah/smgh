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

// Clear previous log on new start
try { fs.writeFileSync(logFile, ''); } catch(e) {}

log('=== SMGH App Starting ===');
log(`Node: ${process.version}`);
log(`PORT: ${process.env.PORT}`);
log(`DIR: ${appDir}`);
log(`CWD: ${process.cwd()}`);

// List files to debug
try {
  const files = fs.readdirSync(appDir).join(', ');
  log(`Files in app dir: ${files}`);
  if (fs.existsSync(path.join(appDir, '.next'))) {
    const nextFiles = fs.readdirSync(path.join(appDir, '.next')).join(', ');
    log(`Files in .next/: ${nextFiles}`);
  }
  if (fs.existsSync(path.join(appDir, '.next', 'standalone'))) {
    const saFiles = fs.readdirSync(path.join(appDir, '.next', 'standalone')).join(', ');
    log(`Files in .next/standalone/: ${saFiles}`);
  }
} catch (e) {
  log(`Error listing files: ${e.message}`);
}

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
    try {
      fs.rmSync(staticDst, { recursive: true, force: true });
    } catch(e) {}
    run(`cp -r ${staticSrc} ${staticDst}`);
  }

  // Copy public/ into standalone/
  const publicSrc = path.join(appDir, 'public');
  const publicDst = path.join(standaloneDir, 'public');
  if (fs.existsSync(publicSrc)) {
    log('Copying public/ into standalone...');
    try {
      fs.rmSync(publicDst, { recursive: true, force: true });
    } catch(e) {}
    run(`cp -r ${publicSrc} ${publicDst}`);
  }
} else {
  log('ERROR: .next/standalone directory does NOT exist!');
  log('The app will NOT work without a build. Run next build first.');
}

// Step 4: Start the standalone server
const serverFile = path.join(standaloneDir, 'server.js');
if (!fs.existsSync(serverFile)) {
  log('ERROR: Standalone server.js not found at ' + serverFile);
  log('Available files in .next/standalone: ' + (fs.readdirSync(standaloneDir).join(', ')));
  process.exit(1);
}

log('=== Starting Next.js standalone server ===');
log('Server will listen on PORT: ' + (process.env.PORT || '3000'));
require(serverFile);
