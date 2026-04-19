const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { parse } = require('url');
const { execSync } = require('child_process');

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

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PORT, '0.0.0.0', () => {
    log('=== SMGH ready on http://0.0.0.0:' + PORT + ' ===');
  });
}).catch((err) => {
  log('ERROR starting server: ' + err.message);
  log(err.stack);
  process.exit(1);
});
