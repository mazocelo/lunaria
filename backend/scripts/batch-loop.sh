#!/bin/bash
# Roda o batch-generate-images em lotes de N, reiniciando o processo
# a cada lote para evitar OOM.
#
# Uso: bash scripts/batch-loop.sh [tipo] [lote] [delay] [provider]
# Ex:  bash scripts/batch-loop.sh monstro 30 5000 pollinations

TYPE="${1:-monstro}"
BATCH="${2:-30}"
DELAY="${3:-5000}"
PROVIDER="${4:-pollinations}"
TOTAL=0
ERRORS=0

echo "=== BATCH LOOP: tipo=$TYPE, lote=$BATCH, delay=${DELAY}ms, provider=$PROVIDER ==="

while true; do
  # Conta pendentes
  PENDING=$(node -e "
    const{PrismaClient}=require('@prisma/client');
    const p=new PrismaClient({log:[]});
    const table={monstro:'monstros',equipamento:'equipamentos',vantagem:'vantagens',desvantagem:'desvantagens',habilidade:'habilidades',raca:'racas',classe:'classes'};
    p[table['$TYPE']].count({where:{imagem:null}}).then(c=>{console.log(c);p.\$disconnect()});
  " 2>/dev/null)

  echo ""
  echo "--- Pendentes: $PENDING | Total gerado: $TOTAL | Erros: $ERRORS ---"

  if [ "$PENDING" -eq 0 ] 2>/dev/null || [ "$PENDING" = "0" ]; then
    echo "=== CONCLUIDO! Total: $TOTAL imagens geradas ==="
    break
  fi

  # Roda um lote
  OUTPUT=$(node --max-old-space-size=200 scripts/batch-generate-images.js \
    --types="$TYPE" --limit="$BATCH" --delay="$DELAY" --provider="$PROVIDER" 2>&1)

  echo "$OUTPUT" | tail -20

  # Conta sucessos e erros nesse lote
  BATCH_OK=$(echo "$OUTPUT" | grep -c '\.\.\.\ OK$')
  BATCH_ERR=$(echo "$OUTPUT" | grep -c '\.\.\.\ ERRO:')
  TOTAL=$((TOTAL + BATCH_OK))
  ERRORS=$((ERRORS + BATCH_ERR))

  # Pequena pausa entre lotes
  sleep 3
done
