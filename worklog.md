---
Task ID: 1
Agent: Main
Task: Fix hero slider and events not showing

Work Log:
- Investigated HomePage.tsx data fetching: hero slider images come from settings API (`hero_slider_images`), events from events API
- Both APIs use Prisma to query SQLite database
- Found dev server binding issue: server was binding to IPv6 only, causing connection refused on 127.0.0.1
- Fixed by adding `-H 0.0.0.0` flag to dev script in package.json
- Seeded SQLite database with full data (9 events, 2 artists, 4 team members, 4 foundation records, 19 site settings)
- Verified all API endpoints return data correctly (settings 200, events 200)

Stage Summary:
- Local dev now working: hero slider and events data available via APIs
- Dev server binding fixed: `next dev -p 3000 -H 0.0.0.0`
- Production site still needs MySQL Prisma client generation and database setup

---
Task ID: 2
Agent: Main
Task: Prepare production build with MySQL support and push to GitHub

Work Log:
- Created prisma/schema.mysql.prisma with MySQL provider and @db.Text annotations for long text fields
- Switched schema to MySQL, generated MySQL Prisma client, built Next.js production
- Restored SQLite schema for local dev
- Created build-production.sh script for future production builds
- Committed .next/ build (with MySQL Prisma client baked in) and pushed to GitHub
- Dev server running with SQLite on localhost:3000

Stage Summary:
- Production build pushed to GitHub (commit ae98324)
- On cPanel: needs to swap schema to MySQL, run `prisma db push`, `prisma seed`, restart app
- Created prisma/schema.mysql.prisma for MySQL deployment
- Key files: schema.prisma (SQLite), schema.mysql.prisma (MySQL), build-production.sh

---
Task ID: 3
Agent: Main
Task: Complete production MySQL deployment preparation

Work Log:
- Found existing schema.mysql.prisma with MySQL provider and @db.Text annotations
- Added missing @db.Text to Event.description, Event.tags, Event.youtubeUrls
- Backed up SQLite schema as schema.sqlite.prisma
- Swapped schema.prisma to MySQL version
- Generated MySQL Prisma client successfully
- Built Next.js production (48 pages, all API routes dynamic)
- Committed 191 files (build artifacts + schema changes)
- Pushed to GitHub (commits ada34f5, 9452ccc)
- Created deploy-to-production.sh script for cPanel server deployment
- Cannot SSH from this environment (no SSH client, no SSH key)

Stage Summary:
- Production build with MySQL Prisma client pushed to GitHub
- Deployment script created: deploy-to-production.sh
- Production server needs: pull code, set DATABASE_URL, run prisma db push, seed database, restart
- User needs to run deploy-to-production.sh on cPanel server via cPanel Terminal

---
Task ID: 4
Agent: Main
Task: Fix Prisma WASM OOM and .htaccess for production deployment

Work Log:
- Diagnosed root cause: `src/generated/prisma/` contained Debian-specific binary target (`libquery_engine-debian-openssl-3.0.x.so.node`), which fails on cPanel's CloudLinux/RHEL server
- When Debian binary fails to load, Prisma falls back to WASM engine, which OOMs on 4GB virtual memory limit
- Fixed `.htaccess`: added `RewriteRule` to proxy requests to Node.js on port 3000
- Removed `src/generated/prisma/` from git tracking (26 files deleted including WASM and .so.node engine)
- Added `src/generated/prisma/` to `.gitignore` — must be generated per-platform
- Added `output = "../src/generated/prisma"` to both SQLite and MySQL schema files
- Created `production-setup.sh` script that: removes old client, runs npm install, runs prisma generate
- Rebuilt `.next` with MySQL schema, restored SQLite schema for local dev
- Committed 268 files and pushed to GitHub (commit 4d07c6d)

Stage Summary:
- Root cause of WASM OOM: platform mismatch between Debian dev and RHEL/CloudLinux production
- Fix: Prisma client must be generated on the production server (not committed from dev machine)
- `.htaccess` now has proper rewrite rule for Node.js proxy
- Production setup: pull code → run `bash production-setup.sh` → restart Node.js app in cPanel
- Database is already seeded (all 21 tables, 9 events, artists, team, settings, hero slider data)

---
Task ID: 1
Agent: main
Task: Fix team page images not showing

Work Log:
- Investigated team page structure: hash-based routing (#/team), TeamPage.tsx fetches /api/team
- Found database was empty - no team members seeded
- Identified root cause: system env var DATABASE_URL was overriding .env file, pointing to wrong database file
- Regenerated Prisma client for SQLite (dev mode)
- Fixed .env to use absolute path: file:/home/z/my-project/prisma/db/smgh.db
- Updated src/lib/db.ts to load dotenv with override:true for correct env precedence
- Fixed prisma/seed.ts to use upsert for events (idempotent seeding)
- Successfully seeded database with 4 team members, 9 events, 2 artists, 4 foundation records, 19 settings
- Verified /api/team returns all 4 team members with correct photo paths
- Verified all 3 team images serve correctly (200 OK) from public/images/team/

Stage Summary:
- Team page images now display correctly
- Database properly seeded with team data including photo paths:
  - Robert Yaw Essuon (Founder) → /images/team/robert-essuon.jpg
  - Victoria Essuon (Co-Founder) → /images/team/victoria-essuon.jpg
  - Christian Agbotah (Managing Director) → /images/team/christian-agbotah.jpg
  - Theodora Boateng (PRO) → /images/team/victoria-essuon.jpg

---
Task ID: 2
Agent: main
Task: Fix team page images not showing - connected to cPanel MySQL

Work Log:
- User reminded us the production site uses MySQL on cPanel, not SQLite
- Switched .env to use cPanel MySQL DATABASE_URL: mysql://lightwor_QrLight:***@lightworldtech.com:3306/lightwor_nestjs_smgh_2026
- Regenerated Prisma client for MySQL using schema.mysql.prisma (with binary targets: debian-openssl-1.0.x, rhel-openssl-1.1.x, native)
- Tested MySQL connection - successfully connected and found 4 team members
- Discovered ROOT CAUSE: photo and bio fields were SWAPPED in the MySQL database
  - photo column contained bio text (e.g. "The visionary behind Sweet Mothers Ghana...")
  - bio column contained image paths (e.g. "/images/team/robert-essuon.jpg")
- Fixed all 4 team members by swapping photo and bio back to correct values
- Verified fix: all members now have correct image paths in photo field
- Verified /api/team returns correct data and images serve with HTTP 200

Stage Summary:
- Team page images now display correctly using cPanel MySQL database
- All 4 team members fixed:
  - Robert Yaw Essuon → /images/team/robert-essuon.jpg
  - Victoria Essuon → /images/team/victoria-essuon.jpg
  - Christian Agbotah → /images/team/christian-agbotah.jpg
  - Theodora Boateng → /images/team/victoria-essuon.jpg
- Environment now properly configured to use production MySQL database

---
Task ID: 3
Agent: main
Task: Resolve cPanel git pull conflict and finalize MySQL migration cleanup

Work Log:
- User reported git pull error on cPanel: local changes to prisma/schema.prisma blocking merge
- Verified current state: schema.prisma already uses MySQL (provider = "mysql", url = env("DATABASE_URL"))
- .env already has MySQL connection string for cPanel production database
- Regenerated Prisma client for MySQL (v6.19.2)
- Verified all API endpoints work correctly with MySQL:
  - /api/settings: 19 settings including hero slider images
  - /api/team: 4 members with correct photo paths
  - /api/events: 9 events
  - /api/artists: 2 artists
- Cleaned up leftover SQLite artifacts:
  - Deleted prisma/schema.sqlite.prisma
  - Deleted prisma/schema.mysql.prisma (no longer needed, main schema is MySQL)
  - Deleted outdated scripts: production-setup.sh, deploy-to-production.sh, build-production.sh
- Updated deploy-cpanel.sh: handles git checkout before pull, removed schema swapping step
- Fixed stale SQLite comment in src/app/api/auth/route.ts
- Committed and pushed (77cd985)

Stage Summary:
- Project is fully MySQL — both local and production use the same database
- Clean deployment script: deploy-cpanel.sh handles everything in 5 steps
- User needs to run on cPanel: git checkout -- . && git pull && npx prisma generate, then restart app

---
Task ID: 4
Agent: main
Task: Fix image upload and add multi-upload support for hero slider and gallery

Work Log:
- Discovered root cause: /api/upload route did NOT exist — 4 components (MediaPicker, MultiMediaPicker, admin/media, admin/foundation) all POST to it
- Created /api/upload/route.ts with: auth check, MIME type validation (images+videos), 10MB size limit, saves to public/uploads/, creates MediaFile DB record
- Replaced single MediaPicker with MultiMediaPicker for hero slider in admin settings page
- Hero slider now supports: upload multiple at once, drag & drop, browse media library, paste URLs, reorder slides, remove individual slides
- Gallery page already had MultiMediaPicker via bulk upload dialog (was broken due to missing /api/upload, now fixed)
- Added public/uploads/ to .gitignore (uploaded files are server-specific)
- Built, committed (8b74cdc), and pushed

Stage Summary:
- Image upload now works across all admin pages: media library, hero slider, gallery, foundation
- Hero slider supports multi-image upload with drag & drop
- Gallery bulk upload works via MultiMediaPicker
- Server-side validation: MIME types (JPG/PNG/GIF/WebP/SVG/MP4/WebM/MOV), 10MB max
