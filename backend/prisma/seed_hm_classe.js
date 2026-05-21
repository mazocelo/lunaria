/**
 * Seed hm_classe — vincula habilidades_magias a classes.
 * Uso: node prisma/seed_hm_classe.js
 *
 * Regras:
 *  - classe_id preenchido: vincula àquela classe
 *  - raca_id preenchido: ignora (vai para hm_raca)
 *  - universal (classe_id=null, raca_id=null):
 *      - técnica de combate (escola_magia null ou 'nenhuma'): vincula a TODAS as classes
 *      - magia (escola_magia com valor real): vincula apenas a classes com slots > 0
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [habilidades, classes, slotsRows] = await Promise.all([
    prisma.habilidades_magias.findMany({ where: { sistema: 'lunaria' }, select: { id: true, classe_id: true, raca_id: true, escola_magia: true } }),
    prisma.classes.findMany({ where: { sistema: 'lunaria' }, select: { id: true, nome: true } }),
    prisma.hm_slots_classe.findMany({ select: { classe_id: true, slots: true } }),
  ]);

  const classesComSlots = new Set(
    slotsRows.filter(r => r.slots > 0).map(r => r.classe_id)
  );

  const allClasseIds = classes.map(c => c.id);
  const casterClasseIds = allClasseIds.filter(id => classesComSlots.has(id));

  const bindings = [];

  for (const hab of habilidades) {
    if (hab.raca_id != null) continue;

    if (hab.classe_id != null) {
      bindings.push({ habilidade_id: hab.id, classe_id: hab.classe_id });
      continue;
    }

    const isMagia = hab.escola_magia != null && hab.escola_magia !== 'nenhuma';
    const targetClasses = isMagia ? casterClasseIds : allClasseIds;

    for (const classeId of targetClasses) {
      bindings.push({ habilidade_id: hab.id, classe_id: classeId });
    }
  }

  await prisma.hm_classe.deleteMany();

  const BATCH = 500;
  let created = 0;
  for (let i = 0; i < bindings.length; i += BATCH) {
    const batch = bindings.slice(i, i + BATCH);
    const result = await prisma.hm_classe.createMany({ data: batch, skipDuplicates: true });
    created += result.count;
  }

  console.log(`hm_classe: ${created} vínculos criados (de ${bindings.length} preparados).`);

  const total = await prisma.hm_classe.count();
  console.log(`Total hm_classe no banco: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
