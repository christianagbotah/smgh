#!/bin/bash
# ============================================================
# SMGH Production Build Script
# This script prepares the project for cPanel deployment
# ============================================================
set -e

echo "========================================="
echo "  SMGH Production Build Script"
echo "========================================="

# Step 1: Switch to MySQL schema
echo ""
echo "[1/5] Switching Prisma schema to MySQL..."
cp prisma/schema.prisma prisma/schema.sqlite.prisma.bak
cp prisma/schema.mysql.prisma prisma/schema.prisma

# Step 2: Generate MySQL Prisma client
echo "[2/5] Generating MySQL Prisma client..."
DATABASE_URL="mysql://root:root@localhost:3306/smgh" npx prisma generate

# Step 3: Build Next.js for production
echo "[3/5] Building Next.js for production..."
DATABASE_URL="mysql://root:root@localhost:3306/smgh" NODE_ENV=production npx next build

# Step 4: Restore SQLite schema for local dev
echo "[4/5] Restoring SQLite schema for local dev..."
cp prisma/schema.sqlite.prisma.bak prisma/schema.prisma
rm prisma/schema.sqlite.prisma.bak
npx prisma generate

# Step 5: Commit and push
echo "[5/5] Ready to commit and push!"
echo ""
echo "========================================="
echo "  Build complete!"
echo "========================================="
echo ""
echo "The .next/ folder contains the MySQL build."
echo "Run these commands to deploy:"
echo "  git add ."
echo "  git commit -m 'production build with MySQL'"
echo "  git push origin main"
echo ""
echo "On cPanel, after pulling:"
echo "  1. Set .env with real DATABASE_URL"
echo "  2. Run: npx prisma db push"
echo "  3. Run: npx tsx prisma/seed.ts"
echo "  4. Restart Node.js app"
