/**
 * Backfill idempotente: garante stats_sistema valido para o personagem id=21.
 *
 * O personagem 21 (sistema dnd5e) ficou com stats_sistema NULL, o que pode
 * corromper leituras que dependem de classeKey/metodo/skillProficiencies.
 * Este script preenche um stats_sistema base apenas se ainda estiver NULL.
 *
 * Idempotente: rodar varias vezes nao causa efeito alem da primeira aplicacao
 * (o WHERE so casa enquanto stats_sistema IS NULL).
 *
 * NAO rodar contra producao manualmente — sera aplicado no deploy.
 *
 * Uso: node scripts/backfill-stats-sistema-id21.js
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STATS_SISTEMA_BASE = {
  classeKey: null,
  metodo: null,
  skillProficiencies: [],
};

async function main() {
  const afetados = await prisma.$executeRaw`
    UPDATE personagens
    SET stats_sistema = ${JSON.stringify(STATS_SISTEMA_BASE)}::jsonb
    WHERE id = 21 AND sistema = 'dnd5e' AND stats_sistema IS NULL
  `;

  console.log(JSON.stringify({
    script: 'backfill-stats-sistema-id21',
    linhasAtualizadas: afetados,
    aplicado: afetados > 0,
    statsSistema: STATS_SISTEMA_BASE,
  }, null, 2));
}

main()
  .catch((e) => {
    console.error('Backfill falhou:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
