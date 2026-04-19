const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const { execSync } = require('child_process');
const { lookup } = require('mime-types');

const dir = __dirname;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  const logFile = path.join(dir, 'smgh-startup.log');
  try { fs.appendFileSync(logFile, line + '\n'); } catch(e) {}
  console.log(line);
}

log('=== SMGH Server Starting ===');
log('Node: ' + process.version);
log('PORT: ' + process.env.PORT);
log('DIR: ' + dir);

// Generate Prisma client if missing
const prismaClientPath = path.join(dir, 'node_modules', '.prisma', 'client');
if (!fs.existsSync(prismaClientPath)) {
  log('Prisma client missing, generating...');
  try {
    execSync('npx prisma generate', { cwd: dir, stdio: 'inherit', timeout: 120000 });
    log('Prisma client generated successfully');
  } catch (e) {
    log('WARNING: Prisma generate failed - ' + e.message);
  }
} else {
  log('Prisma client found');
}

const dev = false;
const next = require('next');
const app = next({ dev, dir });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

// Serve static files from .next/static/ and public/ directly
function serveStatic(req, res, filePath) {
  const fullPath = path.join(dir, filePath);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const contentType = lookup(filePath) || 'application/octet-stream';
    const ext = path.extname(filePath);
    // Cache static assets aggressively
    const cacheMaxAge = filePath.includes('.next/static') ? 31536000 : 86400;
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=' + cacheMaxAge,
      'X-Static-Served': 'true'
    });
    fs.createReadStream(fullPath).pipe(res);
    return true;
  }
  return false;
}

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const urlPath = parsedUrl.pathname;

    // Serve .next/static files directly
    if (urlPath.startsWith('/_next/static/')) {
      if (serveStatic(req, res, '.next' + urlPath)) return;
    }

    // Serve public files directly (favicon, images, etc.)
    if (!urlPath.startsWith('/api') && !urlPath.startsWith('/_next/data')) {
      if (serveStatic(req, res, 'public' + urlPath)) return;
    }

    // Everything else goes to Next.js
    handle(req, res, parsedUrl);
  }).listen(PORT, '0.0.0.0', () => {
    log('=== SMGH ready on http://0.0.0.0:' + PORT + ' ===');
  });
}).catch((err) => {
  log('ERROR starting server: ' + err.message);
  log(err.stack);
  process.exit(1);
});
