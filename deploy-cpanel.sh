#!/bin/bash
# ============================================================
# SMGH PRODUCTION DEPLOYMENT - Run this in cPanel Terminal
# ============================================================
set -e

cd /home/lightwor/smgh-web

echo "=== [1/6] Pulling latest code... ==="
git pull origin main 2>&1
echo "✅ Code pulled"

echo ""
echo "=== [2/6] Writing .env file... ==="
cat > .env << 'ENVEOF'
DATABASE_URL=mysql://lightwor_QrLight:%2A%26%5E%25%24%23%40%21~%29%28Myjesus4me2018@lightworldtech.com:3306/lightwor_nestjs_smgh_2026
NEXT_PUBLIC_BASE_URL=https://sweetmothersgh.org
NODE_ENV=production
ENVEOF
echo "✅ .env written"

echo ""
echo "=== [3/6] Generating Prisma client... ==="
npx prisma generate 2>&1
echo "✅ Prisma client generated"

echo ""
echo "=== [4/6] Pushing database schema to MySQL... ==="
npx prisma db push --accept-data-loss 2>&1
echo "✅ Database schema pushed"

echo ""
echo "=== [5/6] Seeding database with SMGH content... ==="
npx tsx prisma/seed.ts 2>&1
echo "✅ Database seeded"

echo ""
echo "=== [6/6] All done! ==="
echo ""
echo "============================================="
echo "  🎉 Deployment Complete!"
echo "============================================="
echo ""
echo "NOW: Go to cPanel > Software > Node.js app"
echo "Click 'Restart' to reload the application"
echo ""
echo "Then visit: https://sweetmothersgh.org"
echo "  - Hero slider should show 5 event banners"
echo "  - Events section should show 9 events"
echo "  - Admin login: /admin (admin / admin123)"
echo "============================================="
