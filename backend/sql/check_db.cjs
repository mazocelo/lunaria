const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  const total = await p.equipamentos.count();
  const semRar = await p.equipamentos.count({ where: { raridade_id: null } });
  const semCat = await p.equipamentos.count({ where: { categoria_id: null } });
  const rars = await p.raridades.findMany({ orderBy: { id: 'asc' } });
  const cats = await p.categorias_equipamento.findMany({ orderBy: { id: 'asc' } });
  const mTotal = await p.monstros.count();
  const mSemRar = await p.monstros.count({ where: { raridade_id: null } });

  console.log('=== Equipamentos ===');
  console.log('Total:', total, '| sem raridade_id:', semRar, '| sem categoria_id:', semCat);
  console.log('\nRaridades:');
  rars.forEach(r => console.log('  ', r.id, r.nome));
  console.log('\nCategorias:');
  cats.forEach(c => console.log('  ', c.id, c.nome));
  console.log('\n=== Monstros ===');
  console.log('Total:', mTotal, '| sem raridade_id:', mSemRar);

  const sample = await p.equipamentos.findFirst({ include: { raridade_rel: true, categoria_rel: true } });
  if (sample) {
    console.log('\nSample equipamento:', sample.nome);
    console.log('  raridade_id:', sample.raridade_id, '→', sample.raridade_rel?.nome || 'NULL');
    console.log('  categoria_id:', sample.categoria_id, '→', sample.categoria_rel?.nome || 'NULL');
  }

  const mSample = await p.monstros.findFirst({ include: { raridade_rel: true } });
  if (mSample) {
    console.log('\nSample monstro:', mSample.nome);
    console.log('  raridade_id:', mSample.raridade_id, '→', mSample.raridade_rel?.nome || 'NULL');
  }

  await p.$disconnect();
})();
