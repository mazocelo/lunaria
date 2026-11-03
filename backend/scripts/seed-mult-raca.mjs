/**
 * Semeia a coluna `racas.mult_raca` (sistema lunaria) a partir do MULT_RACA_MAP
 * do characterEngine — a fonte unica de sincronizacao. Idempotente: so atualiza
 * rows cujo valor difere do esperado. Racas fora do mapa mantem o valor atual.
 *
 * Uso: node scripts/seed-mult-raca.mjs  (roda no banco do .env padrao do backend)
 * NAO rodar em producao.
 */
import prisma from '../prisma/prisma.js';
import { MULT_RACA_MAP } from '../game-systems/lunaria/characterEngine.js';

async function main() {
  const nomes = Object.keys(MULT_RACA_MAP);
  const racas = await prisma.racas.findMany({
    where: { sistema: 'lunaria', nome: { in: nomes } },
    select: { id: true, nome: true, mult_raca: true },
  });

  let alteradas = 0;
  for (const raca of racas) {
    const esperado = MULT_RACA_MAP[raca.nome];
    if (raca.mult_raca === esperado) continue;
    await prisma.racas.update({ where: { id: raca.id }, data: { mult_raca: esperado } });
    console.log(`  ${raca.nome}: ${raca.mult_raca} -> ${esperado}`);
    alteradas++;
  }

  const ausentes = nomes.filter((n) => !racas.some((r) => r.nome === n));
  if (ausentes.length > 0) {
    console.log(`\n[info] ${ausentes.length} raca(s) do mapa sem row no banco: ${ausentes.join(', ')}`);
  }
  console.log(`\nseed-mult-raca: ${alteradas} row(s) alterada(s) de ${racas.length} raca(s) do mapa (sistema lunaria).`);
}

main()
  .catch((e) => {
    console.error('seed-mult-raca falhou:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
