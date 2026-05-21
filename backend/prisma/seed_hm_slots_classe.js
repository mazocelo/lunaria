/**
 * Seed hm_slots_classe — progressão de slots de magia por classe e nível (1-20).
 * Uso: node prisma/seed_hm_slots_classe.js
 *
 * Idempotente: usa upsert pela chave única @@unique([classe_id, nivel]).
 * Rodar duas vezes não duplica linha; uma reclassificação de classe atualiza
 * o valor de `slots` da linha existente.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FULL_CASTER = ['Mago', 'Feiticeiro', 'Druida', 'Bruxo', 'Elementalista', 'Necromante', 'Xamã', 'Mago Negro', 'Arcanista', 'Conjurador', 'Invocador', 'Sacerdote', 'Clérigo'];
const HALF_CASTER = ['Paladino', 'Ranger', 'Bardo', 'Cavaleiro Arcano', 'Druida Lunar'];
const MINOR_CASTER = ['Ninja', 'Monge', 'Assassino', 'Samurai'];
const NO_MAGIC = ['Guerreiro', 'Bárbaro', 'Berserker', 'Gladiador', 'Caçador'];

function classifyClass(nome) {
  if (FULL_CASTER.includes(nome)) return 'full';
  if (HALF_CASTER.includes(nome)) return 'half';
  if (MINOR_CASTER.includes(nome)) return 'minor';
  if (NO_MAGIC.includes(nome)) return 'none';
  return 'minor';
}

function calcSlots(category, nivel) {
  switch (category) {
    case 'full':  return 4 + (nivel - 1);
    case 'half':  return 2 + Math.floor((nivel - 1) / 2);
    case 'minor': return 1 + Math.floor((nivel - 1) / 3);
    case 'none':  return 0;
    default:      return 0;
  }
}

async function main() {
  const classes = await prisma.classes.findMany({ where: { sistema: 'lunaria' }, select: { id: true, nome: true } });

  if (classes.length === 0) {
    console.log('hm_slots_classe: nenhuma classe encontrada no banco.');
    return;
  }

  const rows = [];

  for (const classe of classes) {
    const category = classifyClass(classe.nome);
    for (let nivel = 1; nivel <= 20; nivel++) {
      rows.push({
        classe_id: classe.id,
        nivel,
        slots: calcSlots(category, nivel),
      });
    }
    console.log(`  ${classe.nome} → ${category} (lv1: ${calcSlots(category, 1)}, lv20: ${calcSlots(category, 20)})`);
  }

  const antes = await prisma.hm_slots_classe.count();

  for (const { classe_id, nivel, slots } of rows) {
    await prisma.hm_slots_classe.upsert({
      where: { classe_id_nivel: { classe_id, nivel } },
      create: { classe_id, nivel, slots },
      update: { slots },
    });
  }

  const depois = await prisma.hm_slots_classe.count();

  console.log(`hm_slots_classe: ${rows.length} linhas aplicadas (${classes.length} classes × 20 níveis).`);
  console.log(`Total hm_slots_classe no banco: ${antes} → ${depois}.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
