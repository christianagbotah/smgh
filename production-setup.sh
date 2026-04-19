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

cd "$APP_DIR"

echo "Step 1: Removing GLOBAL Prisma CLI (cPanel installed one with WASM engine)..."
$NPM_BIN rm -g prisma 2>&1 || echo "  (global prisma not found, continuing)"
# Also remove from virtualenv lib directly
rm -rf /home/lightwor/nodevenv/smgh-web/20/lib/node_modules/prisma 2>/dev/null || true
echo "  Done."

echo ""
echo "Step 2: Removing old generated client and cache..."
rm -rf src/generated/prisma
rm -rf node_modules/.prisma
rm -rf node_modules/.cache/prisma
rm -rf node_modules/prisma
rm -rf node_modules/@prisma
echo "  Done."

echo ""
echo "Step 3: Installing dependencies (fresh)..."
$NPM_BIN install 2>&1
echo "  Done."

echo ""
echo "Step 4: Swapping to MySQL schema for production..."
cp prisma/schema.mysql.prisma prisma/schema.prisma
echo "  Using MySQL schema."
echo "  Provider: $(head -10 prisma/schema.prisma | grep provider | tail -1)"

echo ""
echo "Step 5: Generating Prisma client for this platform..."
echo "  Using local prisma: $APP_DIR/node_modules/prisma/build/index.js"
$NODE_BIN "$APP_DIR/node_modules/prisma/build/index.js" generate --schema="$APP_DIR/prisma/schema.prisma" 2>&1
echo "  Done."

echo ""
echo "Step 6: Verifying generated client..."
if [ -f "src/generated/prisma/index.js" ]; then
  echo "  Prisma client generated successfully!"
  # Show engine type
  ENGINE_FILE=$(ls src/generated/prisma/libquery_engine-*.node 2>/dev/null || ls src/generated/prisma/libquery_engine-*.so 2>/dev/null || echo "")
  if [ -n "$ENGINE_FILE" ]; then
    echo "  Native engine: $(basename $ENGINE_FILE)"
  else
    echo "  WARNING: No native engine file found (may use library engine)"
  fi
  echo "  Active provider in schema:"
  grep 'provider.*=' prisma/schema.prisma | head -2
else
  echo "  ERROR: Prisma client was not generated!"
  exit 1
fi

echo ""
echo "=== Setup Complete ==="
echo "Now restart the Node.js app in cPanel."
