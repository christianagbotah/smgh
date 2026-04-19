#!/bin/bash
# SMGH Production Setup Script
# Run this on the cPanel server after pulling from GitHub
# This script regenerates the Prisma client for the correct platform

set -e

echo "=== SMGH Production Setup ==="
echo ""

APP_DIR="/home/lightwor/smgh-web"
NODE_BIN="/home/lightwor/nodevenv/smgh-web/20/bin/node"
NPM_BIN="/home/lightwor/nodevenv/smgh-web/20/bin/npm"
NPX_BIN="/home/lightwor/nodevenv/smgh-web/20/bin/npx"

cd "$APP_DIR"

echo "Step 1: Removing old Prisma generated client..."
rm -rf src/generated/prisma
rm -rf node_modules/.prisma
rm -rf node_modules/.cache/prisma
echo "  Done."

echo ""
echo "Step 2: Installing dependencies..."
$NPM_BIN install --production=false 2>&1
echo "  Done."

echo ""
echo "Step 3: Generating Prisma client for this platform..."
$NPX_BIN prisma generate 2>&1
echo "  Done."

echo ""
echo "Step 4: Verifying generated client..."
if [ -f "src/generated/prisma/index.js" ]; then
  echo "  Prisma client generated successfully!"
  echo "  Files:"
  ls -la src/generated/prisma/*.so.node src/generated/prisma/*.js src/generated/prisma/*.wasm 2>/dev/null || echo "  (engine files listed)"
else
  echo "  ERROR: Prisma client was not generated!"
  exit 1
fi

echo ""
echo "=== Setup Complete ==="
echo "Now restart the Node.js app in cPanel."
