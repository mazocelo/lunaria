/**
 * Seed D&D 5e SRD monsters — popula monstros e atributos_monstro para o sistema dnd5e.
 * Uso: node prisma/seed_dnd5e_monstros.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// XP by CR (SRD table)
const XP_BY_CR = {
  '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
  '1': 200, '2': 450, '3': 700, '5': 1800,
  '8': 3900, '13': 10000, '21': 33000,
};

// Proficiency by CR
const PROF_BY_CR = {
  '0': 2, '1/8': 2, '1/4': 2, '1/2': 2,
  '1': 2, '2': 2, '3': 2, '5': 3,
  '8': 3, '13': 5, '21': 7,
};

function abilityMod(score) {
  return Math.floor((score - 10) / 2);
}

function calcAtaqueBase(m) {
  const prof = PROF_BY_CR[m.cr] || 2;
  return prof + Math.max(abilityMod(m.STR), abilityMod(m.DEX));
}

function calcDanoBase(cr) {
  const crNum = cr.includes('/') ? eval(cr) : Number(cr);
  if (crNum <= 0.25) return '1d6';
  if (crNum <= 0.5) return '1d8';
  if (crNum <= 1) return '1d10';
  if (crNum <= 3) return '2d6';
  if (crNum <= 5) return '2d8';
  if (crNum <= 8) return '2d10';
  if (crNum <= 13) return '3d8';
  return '3d10';
}

function calcNivelRange(cr) {
  const crNum = cr.includes('/') ? eval(cr) : Number(cr);
  const min = Math.max(1, Math.floor(crNum));
  const max = Math.max(min + 2, Math.ceil(crNum * 1.5) + 1);
  return { min, max };
}

const monstros = [
  {
    nome: 'Goblin',
    descricao: 'Criatura baixa e astuta das cavernas que ataca em bandos. Usa emboscadas e armadilhas para compensar seu tamanho diminuto.',
    STR: 8, DEX: 14, CON: 10, INT: 10, WIS: 8, CHA: 8,
    hp: 7, ac: 15, cr: '1/4',
    tamanho: 'pequeno',
    tipo: ['humanoide'],
  },
  {
    nome: 'Skeleton',
    descricao: 'Restos animados de um guerreiro morto, compelido por magia negra. Obedece cegamente quem o reanimou, lutando sem medo ou hesitação.',
    STR: 10, DEX: 14, CON: 15, INT: 6, WIS: 8, CHA: 5,
    hp: 13, ac: 13, cr: '1/4',
    tamanho: 'medio',
    tipo: ['morto-vivo'],
  },
  {
    nome: 'Wolf',
    descricao: 'Predador ágil que caça em matilha coordenada. Seus ataques em grupo derrubam presas muito maiores que ele.',
    STR: 12, DEX: 15, CON: 12, INT: 3, WIS: 12, CHA: 6,
    hp: 11, ac: 13, cr: '1/4',
    tamanho: 'medio',
    tipo: ['besta'],
  },
  {
    nome: 'Orc',
    descricao: 'Guerreiro brutal de pele acinzentada, movido por fúria e sede de conquista. Avança sem recuar, esmagando oposição com força bruta.',
    STR: 16, DEX: 12, CON: 16, INT: 7, WIS: 11, CHA: 10,
    hp: 15, ac: 13, cr: '1/2',
    tamanho: 'medio',
    tipo: ['humanoide'],
  },
  {
    nome: 'Giant Spider',
    descricao: 'Aracnídeo monstruoso que tece teias enormes em cavernas e florestas. Seu veneno paralisa vítimas para serem devoradas lentamente.',
    STR: 14, DEX: 16, CON: 12, INT: 2, WIS: 11, CHA: 4,
    hp: 26, ac: 14, cr: '1',
    tamanho: 'grande',
    tipo: ['besta'],
  },
  {
    nome: 'Zombie',
    descricao: 'Cadáver reanimado que avança com determinação implacável. Lento mas resistente, recusa-se a cair mesmo quando gravemente ferido.',
    STR: 13, DEX: 6, CON: 16, INT: 3, WIS: 6, CHA: 5,
    hp: 22, ac: 8, cr: '1/4',
    tamanho: 'medio',
    tipo: ['morto-vivo'],
  },
  {
    nome: 'Ogre',
    descricao: 'Gigante estúpido e voraz que esmaga tudo em seu caminho. Sua força bruta compensa totalmente a falta de inteligência.',
    STR: 19, DEX: 8, CON: 16, INT: 5, WIS: 7, CHA: 7,
    hp: 59, ac: 11, cr: '2',
    tamanho: 'grande',
    tipo: ['gigante'],
  },
  {
    nome: 'Owlbear',
    descricao: 'Predador feroz com corpo de urso e cabeça de coruja. Extremamente territorial, ataca qualquer criatura que invada seu domínio.',
    STR: 20, DEX: 12, CON: 17, INT: 3, WIS: 12, CHA: 7,
    hp: 59, ac: 13, cr: '3',
    tamanho: 'grande',
    tipo: ['monstruosidade'],
  },
  {
    nome: 'Troll',
    descricao: 'Criatura gigantesca com regeneração sobrenatural. Seus ferimentos se fecham em segundos — apenas fogo e ácido impedem sua recuperação.',
    STR: 18, DEX: 13, CON: 20, INT: 7, WIS: 9, CHA: 7,
    hp: 84, ac: 15, cr: '5',
    tamanho: 'grande',
    tipo: ['gigante'],
  },
  {
    nome: 'Young Dragon',
    descricao: 'Dragão na flor da idade, já devastador. Domina os céus com voo poderoso e desintegra exércitos com seu sopro elemental.',
    STR: 19, DEX: 10, CON: 17, INT: 12, WIS: 11, CHA: 15,
    hp: 136, ac: 18, cr: '8',
    tamanho: 'grande',
    tipo: ['dragao'],
  },
  {
    nome: 'Vampire',
    descricao: 'Morto-vivo aristocrático que se alimenta do sangue dos vivos. Combina charme sobrenatural com força e velocidade terríveis.',
    STR: 18, DEX: 18, CON: 18, INT: 17, WIS: 15, CHA: 18,
    hp: 144, ac: 16, cr: '13',
    tamanho: 'medio',
    tipo: ['morto-vivo'],
  },
  {
    nome: 'Lich',
    descricao: 'Mago morto-vivo supremo que transcendeu a morte através de rituais proibidos. Seu poder arcano rivaliza com forças cósmicas.',
    STR: 11, DEX: 16, CON: 16, INT: 20, WIS: 14, CHA: 16,
    hp: 135, ac: 17, cr: '21',
    tamanho: 'medio',
    tipo: ['morto-vivo'],
  },
  {
    nome: 'Bandit',
    descricao: 'Ladrão de estrada que embosca viajantes em caminhos perigosos. Covarde sozinho, mas letal quando ataca em grupo bem organizado.',
    STR: 11, DEX: 12, CON: 12, INT: 10, WIS: 10, CHA: 10,
    hp: 11, ac: 12, cr: '1/8',
    tamanho: 'medio',
    tipo: ['humanoide'],
  },
  {
    nome: 'Guard',
    descricao: 'Soldado treinado encarregado de proteger cidades e nobres. Disciplinado e leal, cumpre ordens sem questionar.',
    STR: 13, DEX: 12, CON: 12, INT: 10, WIS: 11, CHA: 10,
    hp: 11, ac: 16, cr: '1/8',
    tamanho: 'medio',
    tipo: ['humanoide'],
  },
  {
    nome: 'Mimic',
    descricao: 'Criatura traiçoeira que assume a forma de objetos mundanos como baús e portas. Quando a vítima se aproxima, revela dentes e garras adesivas.',
    STR: 17, DEX: 12, CON: 15, INT: 5, WIS: 13, CHA: 8,
    hp: 58, ac: 12, cr: '2',
    tamanho: 'medio',
    tipo: ['monstruosidade'],
  },
];

const ATRIBUTOS_DND = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

async function main() {
  console.log(`Inserindo ${monstros.length} monstros D&D 5e...`);

  let inseridos = 0;
  let erros = 0;

  for (const m of monstros) {
    try {
      const { min, max } = calcNivelRange(m.cr);

      const monstro = await prisma.monstros.upsert({
        where: { nome_sistema: { nome: m.nome, sistema: 'dnd5e' } },
        create: {
          nome: m.nome,
          descricao: m.descricao,
          sistema: 'dnd5e',
          hp_base: m.hp,
          ataque_base: calcAtaqueBase(m),
          defesa_base: m.ac,
          dano_base: calcDanoBase(m.cr),
          nivel_min: min,
          nivel_max: max,
          xp_base: XP_BY_CR[m.cr] || 50,
          tamanho: m.tamanho,
          tipo: m.tipo,
        },
        update: {
          descricao: m.descricao,
          hp_base: m.hp,
          ataque_base: calcAtaqueBase(m),
          defesa_base: m.ac,
          dano_base: calcDanoBase(m.cr),
          nivel_min: min,
          nivel_max: max,
          xp_base: XP_BY_CR[m.cr] || 50,
          tamanho: m.tamanho,
          tipo: m.tipo,
        },
      });

      for (const attr of ATRIBUTOS_DND) {
        await prisma.atributos_monstro.upsert({
          where: { monstro_id_nome: { monstro_id: monstro.id, nome: attr } },
          create: { monstro_id: monstro.id, nome: attr, valor: m[attr] },
          update: { valor: m[attr] },
        });
      }

      inseridos++;
    } catch (err) {
      console.error(`Erro em "${m.nome}":`, err.message);
      erros++;
    }
  }

  console.log(`Monstros D&D 5e: ${inseridos} inseridos/atualizados, ${erros} com erro.`);

  const totalMonstros = await prisma.monstros.count({ where: { sistema: 'dnd5e' } });
  const totalAtributos = await prisma.atributos_monstro.count({
    where: { monstros: { sistema: 'dnd5e' } },
  });
  console.log(`Total monstros D&D 5e: ${totalMonstros}, atributos: ${totalAtributos}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
