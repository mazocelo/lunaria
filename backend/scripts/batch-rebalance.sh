#!/bin/bash
# Batch rebalance — 10 monsters at a time with 90s sleep between batches
# Survives rate limiting by spacing out requests

GOOGLE_API_KEY="${GOOGLE_API_KEY:?export GOOGLE_API_KEY first}"
START=${1:-124}
BATCH=10
TOTAL=330
SLEEP_BETWEEN=30

echo "🐉 Batch Monster Rebalance — start=$START batch=$BATCH sleep=${SLEEP_BETWEEN}s"

CURRENT=$START
while [ $CURRENT -le $TOTAL ]; do
  echo ""
  echo "=== Batch starting at ID $CURRENT ($(date)) ==="
  GOOGLE_API_KEY=$GOOGLE_API_KEY node /opt/role-chat-game/backend/scripts/rebalance-monsters.js --start=$CURRENT --limit=$BATCH 2>&1

  CURRENT=$((CURRENT + BATCH))

  if [ $CURRENT -le $TOTAL ]; then
    echo "⏳ Sleeping ${SLEEP_BETWEEN}s before next batch..."
    sleep $SLEEP_BETWEEN
  fi
done

echo ""
echo "✅ All batches complete!"
