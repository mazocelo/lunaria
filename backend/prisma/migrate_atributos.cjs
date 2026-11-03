const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ATRIBUTOS = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'];

async function migratePersonagens() {
  const personagens = await prisma.personagens.findMany({
    select: {
      id: true,
      forca: true,
      destreza: true,
      constituicao: true,
      inteligencia: true,
      agilidade: true,
      carisma: true,
    },
  });

  console.log(`Encontrados ${personagens.length} personagens para migrar.`);

  for (const p of personagens) {
    for (const attr of ATRIBUTOS) {
      await prisma.atributos_personagem.upsert({
        where: {
          personagem_id_nome: { personagem_id: p.id, nome: attr },
        },
        update: { valor: p[attr] ?? 10 },
        create: {
          personagem_id: p.id,
          nome: attr,
          valor: p[attr] ?? 10,
        },
      });
    }
  }

  const totalRows = await prisma.atributos_personagem.count();
  const expected = personagens.length * ATRIBUTOS.length;
  console.log(`atributos_personagem: ${totalRows} rows (esperado: ${expected})`);

  if (totalRows !== expected) {
    throw new Error(`Contagem incorreta! Esperado ${expected}, obteve ${totalRows}`);
  }
}

async function migrateMonstros() {
  const monstros = await prisma.monstros.findMany({
    select: {
      id: true,
      forca: true,
      destreza: true,
      constituicao: true,
      inteligencia: true,
      agilidade: true,
      carisma: true,
    },
  });

  console.log(`Encontrados ${monstros.length} monstros para migrar.`);

  for (const m of monstros) {
    for (const attr of ATRIBUTOS) {
      await prisma.atributos_monstro.upsert({
        where: {
          monstro_id_nome: { monstro_id: m.id, nome: attr },
        },
        update: { valor: m[attr] ?? 10 },
        create: {
          monstro_id: m.id,
          nome: attr,
          valor: m[attr] ?? 10,
        },
      });
    }
  }

  const totalRows = await prisma.atributos_monstro.count();
  const expected = monstros.length * ATRIBUTOS.length;
  console.log(`atributos_monstro: ${totalRows} rows (esperado: ${expected})`);

  if (totalRows !== expected) {
    throw new Error(`Contagem incorreta! Esperado ${expected}, obteve ${totalRows}`);
  }
}

async function main() {
  console.log('Iniciando migração de atributos...\n');

  await migratePersonagens();
  console.log('');
  await migrateMonstros();

  console.log('\nMigração concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro na migração:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
