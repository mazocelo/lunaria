import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateBonus(table, name, transformFn, extraFields = {}) {
  const entity = table === 'racas'
    ? await prisma.racas.findFirst({ where: { nome: name } })
    : await prisma.classes.findFirst({ where: { nome: name } });

  if (!entity) {
    console.error(`[ERROR] ${table}/${name} not found!`);
    return;
  }

  const oldBonus = JSON.parse(entity.bonus);
  const newBonus = transformFn({ ...oldBonus });
  const newBonusStr = JSON.stringify(newBonus);

  console.log(`\n--- ${table.toUpperCase()} / ${name} (id=${entity.id}) ---`);
  console.log('BEFORE:', entity.bonus);
  console.log('AFTER: ', newBonusStr);
  if (Object.keys(extraFields).length > 0) {
    console.log('EXTRA: ', JSON.stringify(extraFields));
  }

  const updateData = { bonus: newBonusStr, ...extraFields };

  if (table === 'racas') {
    await prisma.racas.update({ where: { id: entity.id }, data: updateData });
  } else {
    await prisma.classes.update({ where: { id: entity.id }, data: updateData });
  }

  console.log('[OK] Updated.');
}

async function main() {
  console.log('=== RACE & CLASS BONUS REDISTRIBUTION MIGRATION ===\n');

  // --- RACES ---

  // Pardalino: DEX+2 -> DEX+1, AGI+1
  await updateBonus('racas', 'Pardalino', (b) => {
    delete b.destreza;
    b.destreza = '+1';
    b.agilidade = '+1';
    return b;
  });

  // Halfling: DEX+2 -> DEX+1, AGI+1
  await updateBonus('racas', 'Halfling', (b) => {
    delete b.destreza;
    b.destreza = '+1';
    b.agilidade = '+1';
    return b;
  });

  // Elfo: DEX+1, INT+1 -> AGI+1, INT+1
  await updateBonus('racas', 'Elfo', (b) => {
    delete b.destreza;
    b.agilidade = '+1';
    return b;
  });

  // Anfibio: CON+1 -> AGI+1
  await updateBonus('racas', 'Anfíbio', (b) => {
    delete b.constituicao;
    b.agilidade = '+1';
    return b;
  });

  // Troglodita: FOR+1, CON+1 -> FOR+1, AGI+1
  await updateBonus('racas', 'Troglodita', (b) => {
    delete b.constituicao;
    b.agilidade = '+1';
    return b;
  });

  // Licantropo: FOR+1, CON+1 -> FOR+1, AGI+1
  await updateBonus('racas', 'Licantropo', (b) => {
    delete b.constituicao;
    b.agilidade = '+1';
    return b;
  });

  // Verdeante: CON+1, DEX+1 -> CON+1, AGI+1
  await updateBonus('racas', 'Verdeante', (b) => {
    delete b.destreza;
    b.agilidade = '+1';
    return b;
  });

  // Fada: DEX+1, CHA+1 -> AGI+1, CHA+1
  await updateBonus('racas', 'Fada', (b) => {
    delete b.destreza;
    b.agilidade = '+1';
    return b;
  });

  // Ogro: FOR+3, CON+3 -> FOR+2, CON+2 (also mult_raca=7, custo=3)
  await updateBonus('racas', 'Ogro', (b) => {
    b.forca = '+2';
    b.constituicao = '+2';
    return b;
  }, { mult_raca: 7, custo: 3 });

  // --- CLASSES ---

  // Ranger: DEX+1, CON+1 -> DEX+1, AGI+1
  await updateBonus('classes', 'Ranger', (b) => {
    delete b.constituicao;
    b.agilidade = '+1';
    return b;
  });

  // Swashbuckler: DEX+1, CHA+1 -> AGI+1, CHA+1
  await updateBonus('classes', 'Swashbuckler', (b) => {
    delete b.destreza;
    b.agilidade = '+1';
    return b;
  });

  // Ladino: DEX+1, CHA+1 -> DEX+1, AGI+1
  await updateBonus('classes', 'Ladino', (b) => {
    delete b.carisma;
    b.agilidade = '+1';
    return b;
  });

  console.log('\n=== MIGRATION COMPLETE ===');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
