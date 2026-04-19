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
