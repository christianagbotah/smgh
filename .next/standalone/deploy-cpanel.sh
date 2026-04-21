#!/bin/bash
# ============================================================
# SMGH PRODUCTION DEPLOYMENT - Run this in cPanel Terminal
# ============================================================
set -e

cd /home/lightwor/smgh-web

echo "=== [1/5] Discarding local changes and pulling latest code... ==="
git checkout -- . 2>/dev/null || true
git pull origin main 2>&1
echo "Code pulled"

echo ""
echo "=== [2/5] Writing .env file... ==="
cat > .env << 'ENVEOF'
DATABASE_URL=mysql://lightwor_QrLight:%2A%26%5E%25%24%23%40%21~%29%28Myjesus4me2018@lightworldtech.com:3306/lightwor_nestjs_smgh_2026
NEXT_PUBLIC_BASE_URL=https://sweetmothersgh.org
NODE_ENV=production
ENVEOF
echo ".env written"

echo ""
echo "=== [3/5] Generating Prisma client for this platform... ==="
rm -rf src/generated/prisma
npx prisma generate 2>&1
echo "Prisma client generated"

echo ""
echo "=== [4/5] Syncing database schema... ==="
npx prisma db push 2>&1
echo "Database schema synced"

echo ""
echo "=== [5/5] All done! ==="
echo ""
echo "============================================="
echo "  Deployment Complete!"
echo "============================================="
echo ""
echo "NOW: Go to cPanel > Software > Node.js app"
echo "Click 'Restart' to reload the application"
echo ""
echo "Then visit: https://sweetmothersgh.org"
echo "============================================="
