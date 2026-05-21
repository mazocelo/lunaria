/**
 * Seed D&D 5e SRD races — popula a tabela racas para o sistema dnd5e.
 * Uso: node prisma/seed_dnd5e_racas.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const racas = [
  {
    nome: 'Human',
    descricao: 'Versáteis e ambiciosos, os humanos são a raça mais adaptável dos reinos. Sua determinação e diversidade os tornam presença constante em qualquer terra.',
    bonus: {
      abilityBonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 },
      traits: ['Extra Language'],
      speed: 30,
      size: 'Medium',
      languages: ['Common', 'One extra'],
    },
  },
  {
    nome: 'Elf',
    descricao: 'Graciosos e longevos, os elfos possuem sentidos aguçados e afinidade natural com a magia. Habitam florestas ancestrais e valorizam arte e liberdade.',
    bonus: {
      abilityBonuses: { DEX: 2 },
      traits: ['Darkvision', 'Fey Ancestry', 'Trance', 'Keen Senses'],
      speed: 30,
      size: 'Medium',
      languages: ['Common', 'Elvish'],
    },
  },
  {
    nome: 'Dwarf',
    descricao: 'Robustos e destemidos, os anões são mestres artesãos que habitam fortalezas subterrâneas. Sua resistência e lealdade são lendárias.',
    bonus: {
      abilityBonuses: { CON: 2 },
      traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning', 'Dwarven Combat Training'],
      speed: 25,
      size: 'Medium',
      languages: ['Common', 'Dwarvish'],
    },
  },
  {
    nome: 'Halfling',
    descricao: 'Pequenos e ágeis, os halflings são criaturas alegres que valorizam conforto e boa comida. Sua sorte natural os tira dos piores apuros.',
    bonus: {
      abilityBonuses: { DEX: 2 },
      traits: ['Lucky', 'Brave', 'Halfling Nimbleness'],
      speed: 25,
      size: 'Small',
      languages: ['Common', 'Halfling'],
    },
  },
  {
    nome: 'Gnome',
    descricao: 'Curiosos e inventivos, os gnomos são movidos por uma sede insaciável de conhecimento. Sua mente brilhante os torna resistentes a ilusões.',
    bonus: {
      abilityBonuses: { INT: 2 },
      traits: ['Darkvision', 'Gnome Cunning'],
      speed: 25,
      size: 'Small',
      languages: ['Common', 'Gnomish'],
    },
  },
  {
    nome: 'Half-Elf',
    descricao: 'Herdeiros de dois mundos, os meio-elfos combinam a versatilidade humana com a graça élfica. Diplomatas natos, transitam entre culturas com facilidade.',
    bonus: {
      abilityBonuses: { CHA: 2, choice: { count: 2, amount: 1, from: ['STR', 'DEX', 'CON', 'INT', 'WIS'] } },
      traits: ['Darkvision', 'Fey Ancestry', 'Skill Versatility'],
      speed: 30,
      size: 'Medium',
      languages: ['Common', 'Elvish', 'One extra'],
    },
  },
  {
    nome: 'Half-Orc',
    descricao: 'Forjados entre duas heranças, os meio-orcs combinam força bruta com tenacidade implacável. Quando caem, levantam-se com fúria redobrada.',
    bonus: {
      abilityBonuses: { STR: 2, CON: 1 },
      traits: ['Darkvision', 'Relentless Endurance', 'Savage Attacks', 'Menacing'],
      speed: 30,
      size: 'Medium',
      languages: ['Common', 'Orc'],
    },
  },
  {
    nome: 'Tiefling',
    descricao: 'Marcados por uma herança infernal, os tieflings carregam chifres e caudas como lembrança de pactos ancestrais. Seu carisma sombrio esconde poder latente.',
    bonus: {
      abilityBonuses: { CHA: 2, INT: 1 },
      traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],
      speed: 30,
      size: 'Medium',
      languages: ['Common', 'Infernal'],
    },
  },
  {
    nome: 'Dragonborn',
    descricao: 'Descendentes de dragões, os dragonborn exalam orgulho e poder. Seu sopro devastador e escamas resistentes honram a linhagem dracônica.',
    bonus: {
      abilityBonuses: { STR: 2, CHA: 1 },
      traits: ['Breath Weapon', 'Damage Resistance', 'Draconic Ancestry'],
      speed: 30,
      size: 'Medium',
      languages: ['Common', 'Draconic'],
    },
  },
];

async function main() {
  console.log(`Inserindo ${racas.length} raças D&D 5e...`);

  let inseridas = 0;
  let erros = 0;

  for (const r of racas) {
    try {
      await prisma.racas.upsert({
        where: { nome_sistema: { nome: r.nome, sistema: 'dnd5e' } },
        create: {
          nome: r.nome,
          descricao: r.descricao,
          custo: 0,
          pode_magia: true,
          bonus: JSON.stringify(r.bonus),
          sistema: 'dnd5e',
        },
        update: {
          descricao: r.descricao,
          custo: 0,
          pode_magia: true,
          bonus: JSON.stringify(r.bonus),
        },
      });
      inseridas++;
    } catch (err) {
      console.error(`Erro em "${r.nome}":`, err.message);
      erros++;
    }
  }

  console.log(`Raças D&D 5e: ${inseridas} inseridas/atualizadas, ${erros} com erro.`);

  const total = await prisma.racas.count({ where: { sistema: 'dnd5e' } });
  console.log(`Total raças D&D 5e no banco: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
