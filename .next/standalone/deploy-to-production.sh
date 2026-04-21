#!/bin/bash
# ============================================================
# SMGH Production Deployment Script
# Run this on the cPanel server (via cPanel Terminal or SSH)
# From the app directory: /home/lightwor/smgh-web
# ============================================================
set -e

APP_DIR="/home/lightwor/smgh-web"
cd "$APP_DIR"

echo "========================================="
echo "  SMGH Production Deployment"
echo "========================================="
echo "Working directory: $(pwd)"
echo "Current time: $(date)"
echo ""

# Step 1: Pull latest code from GitHub
echo "[1/5] Pulling latest code from GitHub..."
git pull origin main
echo "✅ Code pulled successfully"
echo ""

# Step 2: Check if .env exists and has DATABASE_URL
echo "[2/5] Checking environment configuration..."
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "   Creating .env from template..."
    cat > .env << 'ENVEOF'
DATABASE_URL=mysql://DB_USER:DB_PASSWORD@localhost:3306/DB_NAME
NEXT_PUBLIC_BASE_URL=https://sweetmothersgh.org
NODE_ENV=production
ENVEOF
    echo "❌ IMPORTANT: You must edit .env and replace DB_USER, DB_PASSWORD, and DB_NAME with your actual MySQL credentials!"
    echo "   Then re-run this script."
    exit 1
fi

# Verify DATABASE_URL is set and not a placeholder
DB_URL=$(grep DATABASE_URL .env | head -1 | cut -d'=' -f2-)
if [ -z "$DB_URL" ]; then
    echo "❌ DATABASE_URL not set in .env!"
    echo "   Add: DATABASE_URL=mysql://username:password@localhost:3306/database_name"
    echo "   Then re-run this script."
    exit 1
fi

if echo "$DB_URL" | grep -q "DB_USER\|DB_PASSWORD\|DB_NAME\|username:password"; then
    echo "❌ DATABASE_URL contains placeholder values!"
    echo "   Current: $DB_URL"
    echo "   Edit .env and set your actual MySQL credentials."
    echo ""
    echo "   To create a MySQL database in cPanel:"
    echo "   1. Go to cPanel > MySQL Databases"
    echo "   2. Create a new database (e.g., lightwor_smgh)"
    echo "   3. Create a database user with password"
    echo "   4. Add the user to the database with ALL PRIVILEGES"
    echo "   5. Update .env with: DATABASE_URL=mysql://user:password@localhost:3306/lightwor_smgh"
    exit 1
fi

echo "✅ DATABASE_URL found: ${DB_URL:0:20}..."
echo ""

# Step 3: Generate Prisma client (should already be in .next/ from build)
echo "[3/5] Generating Prisma client..."
npx prisma generate 2>&1
echo "✅ Prisma client generated"
echo ""

# Step 4: Push schema to MySQL (create/update tables)
echo "[4/5] Pushing database schema to MySQL..."
npx prisma db push --accept-data-loss 2>&1
echo "✅ Database schema pushed"
echo ""

# Step 5: Seed the database
echo "[5/5] Seeding database with SMGH content..."
npx tsx prisma/seed.ts 2>&1
echo "✅ Database seeded"
echo ""

# Step 6: Restart the app (cPanel Node.js)
echo "[6/6] Restarting Node.js application..."
if command -v phpnpm &> /dev/null; then
    # cPanel Ea4 style
    /opt/cpanel/ea-nodejs10/bin/node server.js &
    echo "✅ Server restarted"
elif [ -f "restart.sh" ]; then
    bash restart.sh
    echo "✅ Server restarted via restart.sh"
else
    echo "⚠️  Could not auto-restart. Please restart the app from:"
    echo "   cPanel > Software > Node.js > Restart button"
    echo "   OR run: pkill -f 'node server.js' && node server.js &"
fi

echo ""
echo "========================================="
echo "  🎉 Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Visit https://sweetmothersgh.org to verify"
echo "  2. Check hero slider shows event banners"
echo "  3. Check events section shows all events"
echo "  4. Admin login: /admin (admin / admin123)"
echo ""
echo "If something went wrong, check logs:"
echo "  cat smgh-startup.log"
echo "========================================="
