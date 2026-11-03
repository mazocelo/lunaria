/**
 * Seed D&D 5e SRD classes — popula a tabela classes para o sistema dnd5e.
 * Uso: node prisma/seed_dnd5e_classes.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const classes = [
  {
    nome: 'Barbarian',
    descricao: 'Guerreiro primal movido pela fúria. Em combate, entra em estado de rage que amplifica sua força e resistência além dos limites mortais.',
    bonus: {
      hitDie: 'd12',
      spellcasting: null,
      castingAbility: null,
      primaryAbility: ['STR'],
      savingThrows: ['STR', 'CON'],
      armorProficiencies: ['light', 'medium', 'shields'],
      weaponProficiencies: ['simple', 'martial'],
      features: ['Rage', 'Unarmored Defense', 'Reckless Attack', 'Danger Sense'],
    },
  },
  {
    nome: 'Bard',
    descricao: 'Artista arcano cuja música e palavras canalizam magia. Inspira aliados, confunde inimigos e possui conhecimento sobre quase tudo.',
    bonus: {
      hitDie: 'd8',
      spellcasting: 'full',
      castingAbility: 'CHA',
      primaryAbility: ['CHA'],
      savingThrows: ['DEX', 'CHA'],
      armorProficiencies: ['light'],
      weaponProficiencies: ['simple', 'hand crossbow', 'longsword', 'rapier', 'shortsword'],
      features: ['Bardic Inspiration', 'Jack of All Trades', 'Song of Rest', 'Expertise'],
    },
  },
  {
    nome: 'Cleric',
    descricao: 'Campeão divino que canaliza o poder de sua divindade. Cura feridas, repele mortos-vivos e empunha armas sagradas com fervor inabalável.',
    bonus: {
      hitDie: 'd8',
      spellcasting: 'full',
      castingAbility: 'WIS',
      primaryAbility: ['WIS'],
      savingThrows: ['WIS', 'CHA'],
      armorProficiencies: ['light', 'medium', 'shields'],
      weaponProficiencies: ['simple'],
      features: ['Divine Domain', 'Channel Divinity', 'Turn Undead'],
    },
  },
  {
    nome: 'Druid',
    descricao: 'Guardião da natureza que comanda os elementos e as feras. Pode assumir formas animais e conjurar o poder selvagem do mundo natural.',
    bonus: {
      hitDie: 'd8',
      spellcasting: 'full',
      castingAbility: 'WIS',
      primaryAbility: ['WIS'],
      savingThrows: ['INT', 'WIS'],
      armorProficiencies: ['light', 'medium', 'shields'],
      weaponProficiencies: ['club', 'dagger', 'dart', 'javelin', 'mace', 'quarterstaff', 'scimitar', 'sickle', 'sling', 'spear'],
      features: ['Druidic', 'Wild Shape', 'Druid Circle'],
    },
  },
  {
    nome: 'Fighter',
    descricao: 'Mestre do combate marcial treinado em todas as armas e armaduras. Versatilidade tática e resistência fazem dele o pilar de qualquer grupo.',
    bonus: {
      hitDie: 'd10',
      spellcasting: null,
      castingAbility: null,
      primaryAbility: ['STR', 'DEX'],
      savingThrows: ['STR', 'CON'],
      armorProficiencies: ['light', 'medium', 'heavy', 'shields'],
      weaponProficiencies: ['simple', 'martial'],
      features: ['Fighting Style', 'Second Wind', 'Action Surge', 'Extra Attack'],
    },
  },
  {
    nome: 'Monk',
    descricao: 'Artista marcial que canaliza ki — energia vital interior. Seus punhos são armas letais e seu corpo se move com velocidade sobrenatural.',
    bonus: {
      hitDie: 'd8',
      spellcasting: null,
      castingAbility: null,
      primaryAbility: ['DEX', 'WIS'],
      savingThrows: ['STR', 'DEX'],
      armorProficiencies: [],
      weaponProficiencies: ['simple', 'shortsword'],
      features: ['Unarmored Defense', 'Martial Arts', 'Ki', 'Flurry of Blows', 'Deflect Missiles'],
    },
  },
  {
    nome: 'Paladin',
    descricao: 'Cavaleiro sagrado que combina proeza marcial com magia divina. Seu juramento lhe concede poder para esmagar o mal e proteger os inocentes.',
    bonus: {
      hitDie: 'd10',
      spellcasting: 'half',
      castingAbility: 'CHA',
      primaryAbility: ['STR', 'CHA'],
      savingThrows: ['WIS', 'CHA'],
      armorProficiencies: ['light', 'medium', 'heavy', 'shields'],
      weaponProficiencies: ['simple', 'martial'],
      features: ['Divine Sense', 'Lay on Hands', 'Divine Smite', 'Sacred Oath'],
    },
  },
  {
    nome: 'Ranger',
    descricao: 'Caçador das terras selvagens que combina habilidade marcial com magia natural. Rastreia presas através de qualquer terreno com precisão mortal.',
    bonus: {
      hitDie: 'd10',
      spellcasting: 'half',
      castingAbility: 'WIS',
      primaryAbility: ['DEX', 'WIS'],
      savingThrows: ['STR', 'DEX'],
      armorProficiencies: ['light', 'medium', 'shields'],
      weaponProficiencies: ['simple', 'martial'],
      features: ['Favored Enemy', 'Natural Explorer', 'Fighting Style', 'Ranger Archetype'],
    },
  },
  {
    nome: 'Rogue',
    descricao: 'Especialista furtivo que ataca de surpresa com precisão cirúrgica. Suas habilidades vão de arrombamento a venenos, sempre com estilo.',
    bonus: {
      hitDie: 'd8',
      spellcasting: null,
      castingAbility: null,
      primaryAbility: ['DEX'],
      savingThrows: ['DEX', 'INT'],
      armorProficiencies: ['light'],
      weaponProficiencies: ['simple', 'hand crossbow', 'longsword', 'rapier', 'shortsword'],
      features: ['Sneak Attack', 'Thieves\' Cant', 'Cunning Action', 'Evasion', 'Expertise'],
    },
  },
  {
    nome: 'Sorcerer',
    descricao: 'Conjurador nato cujo poder mágico flui no sangue. Manipula a magia de forma instintiva, moldando feitiços com metamagia devastadora.',
    bonus: {
      hitDie: 'd6',
      spellcasting: 'full',
      castingAbility: 'CHA',
      primaryAbility: ['CHA'],
      savingThrows: ['CON', 'CHA'],
      armorProficiencies: [],
      weaponProficiencies: ['dagger', 'dart', 'sling', 'quarterstaff', 'light crossbow'],
      features: ['Sorcerous Origin', 'Font of Magic', 'Sorcery Points', 'Metamagic'],
    },
  },
  {
    nome: 'Warlock',
    descricao: 'Arcanista que obteve poder através de um pacto com entidade sobrenatural. Seus feitiços são poucos mas devastadores, recarregando rapidamente.',
    bonus: {
      hitDie: 'd8',
      spellcasting: 'pact',
      castingAbility: 'CHA',
      primaryAbility: ['CHA'],
      savingThrows: ['WIS', 'CHA'],
      armorProficiencies: ['light'],
      weaponProficiencies: ['simple'],
      features: ['Otherworldly Patron', 'Pact Magic', 'Eldritch Invocations', 'Pact Boon'],
    },
  },
  {
    nome: 'Wizard',
    descricao: 'Estudioso das artes arcanas que domina magia através de conhecimento e disciplina. Seu grimório contém feitiços para cada situação imaginável.',
    bonus: {
      hitDie: 'd6',
      spellcasting: 'full',
      castingAbility: 'INT',
      primaryAbility: ['INT'],
      savingThrows: ['INT', 'WIS'],
      armorProficiencies: [],
      weaponProficiencies: ['dagger', 'dart', 'sling', 'quarterstaff', 'light crossbow'],
      features: ['Arcane Recovery', 'Arcane Tradition', 'Spell Mastery', 'Signature Spells'],
    },
  },
];

async function main() {
  console.log(`Inserindo ${classes.length} classes D&D 5e...`);

  let inseridas = 0;
  let erros = 0;

  for (const c of classes) {
    try {
      await prisma.classes.upsert({
        where: { nome_sistema: { nome: c.nome, sistema: 'dnd5e' } },
        create: {
          nome: c.nome,
          descricao: c.descricao,
          custo: 0,
          bonus: JSON.stringify(c.bonus),
          sistema: 'dnd5e',
        },
        update: {
          descricao: c.descricao,
          custo: 0,
          bonus: JSON.stringify(c.bonus),
        },
      });
      inseridas++;
    } catch (err) {
      console.error(`Erro em "${c.nome}":`, err.message);
      erros++;
    }
  }

  console.log(`Classes D&D 5e: ${inseridas} inseridas/atualizadas, ${erros} com erro.`);

  const total = await prisma.classes.count({ where: { sistema: 'dnd5e' } });
  console.log(`Total classes D&D 5e no banco: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
