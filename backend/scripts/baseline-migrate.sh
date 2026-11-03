#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# baseline-migrate.sh
#
# Run this ONCE on the VPS before the first deploy that uses
# `prisma migrate deploy`. It marks existing migrations as
# already applied so Prisma won't try to re-run them on a
# database that already has all the tables.
#
# Usage:
#   cd /opt/role-chat-game/backend
#   bash scripts/baseline-migrate.sh
#
# Prerequisites:
#   - DATABASE_URL must be set (loaded from .env or exported)
#   - The database already has all tables created via `db push`
#   - Node.js and npx available
# ─────────────────────────────────────────────────────────────────────

set -euo pipefail

echo "=== Prisma Migrate Baseline Setup ==="
echo ""
echo "This script marks the existing migrations as already applied"
echo "in the _prisma_migrations table, so 'prisma migrate deploy'"
echo "will not try to re-create tables that already exist."
echo ""

# Ensure we're in the backend directory
if [ ! -f "prisma/schema.prisma" ]; then
  echo "ERROR: prisma/schema.prisma not found."
  echo "Please run this script from the backend root directory."
  exit 1
fi

# Mark baseline migration as already applied
echo "[1/2] Marking 0_baseline as already applied..."
npx prisma migrate resolve --applied 0_baseline

# Mark ai_jobs migration as already applied
echo "[2/2] Marking 20260313170000_add_ai_jobs as already applied..."
npx prisma migrate resolve --applied 20260313170000_add_ai_jobs

echo ""
echo "=== Done! ==="
echo ""
echo "Both migrations have been marked as applied."
echo "Future deploys with 'prisma migrate deploy' will work correctly."
echo ""
echo "You can verify by running:"
echo "  npx prisma migrate status"
