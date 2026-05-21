/**
 * Seed hm_raca — vincula habilidades raciais às suas raças.
 * Uso: node prisma/seed_hm_raca.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const raciais = await prisma.habilidades_magias.findMany({
    where: { sistema: 'lunaria', raca_id: { not: null } },
    select: { id: true, raca_id: true },
  });

  if (raciais.length === 0) {
    console.log('hm_raca: nenhuma habilidade racial encontrada.');
    return;
  }

  const bindings = raciais.map(h => ({
    habilidade_id: h.id,
    raca_id: h.raca_id,
  }));

  await prisma.hm_raca.deleteMany();

  const result = await prisma.hm_raca.createMany({ data: bindings, skipDuplicates: true });

  console.log(`hm_raca: ${result.count} vínculos criados.`);

  const total = await prisma.hm_raca.count();
  console.log(`Total hm_raca no banco: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
