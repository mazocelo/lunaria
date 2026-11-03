/**
 * Seed pode_magia — marca raças sem aptidão mágica.
 * Uso: node prisma/seed_pode_magia.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEM_MAGIA = ['Golem', 'Androide', 'Autômato', 'Construto', 'Forjado-Bélico'];

async function main() {
  const racas = await prisma.racas.findMany({ where: { sistema: 'lunaria' }, select: { id: true, nome: true } });

  if (racas.length === 0) {
    console.log('seed_pode_magia: nenhuma raça encontrada.');
    return;
  }

  let updated = 0;

  for (const raca of racas) {
    const podeMagia = !SEM_MAGIA.includes(raca.nome);
    await prisma.racas.update({
      where: { id: raca.id },
      data: { pode_magia: podeMagia },
    });
    if (!podeMagia) {
      console.log(`  ${raca.nome} → pode_magia: false`);
      updated++;
    }
  }

  console.log(`seed_pode_magia: ${updated} raças marcadas sem magia (de ${racas.length} total).`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
