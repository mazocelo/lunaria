// seed_tresdet_racas.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const RACAS = [
  // ===== Semi-humanos =====
  { nome: 'Humano', descricao: 'A raça mais abundante e adaptável. Versáteis e ambiciosos, humanos se destacam em qualquer campo.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Adaptabilidade'], desvantagens_inclusas: [] },
  { nome: 'Anão', descricao: 'Humanoides robustos de baixa estatura. Famosos pela resistência à magia e mestria em forjar armas e armaduras.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Resistência a Magia', 'Armadura Extra'], desvantagens_inclusas: [] },
  { nome: 'Elfo', descricao: 'Seres graciosos e longevos com sentidos aguçados e afinidade natural com a magia e a natureza.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Sentidos Especiais', 'Aceleração'], desvantagens_inclusas: [] },
  { nome: 'Elfo Negro', descricao: 'Elfos que vivem nas profundezas, dominando as trevas. Possuem visão no escuro e afinidade com magia sombria.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Sentidos Especiais', 'Magia Negra'], desvantagens_inclusas: [] },
  { nome: 'Gnomo', descricao: 'Pequenos e engenhosos, gnomos combinam inteligência aguçada com sentidos excepcionais.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Genialidade', 'Sentidos Especiais'], desvantagens_inclusas: [] },
  { nome: 'Halfling', descricao: 'Criaturas pequenas e sorrateiras com uma sorte sobrenatural e aparência desarmante.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Aparência Inofensiva', 'Sortudo'], desvantagens_inclusas: [] },
  { nome: 'Meio-Elfo', descricao: 'Fruto da união entre humanos e elfos. Combina adaptabilidade humana com sentidos élficos.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: [] },
  { nome: 'Meio-Orc', descricao: 'Resultado da união entre orcs e humanos. Herda a força bruta orca com mais controle e inteligência.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: [] },
  { nome: 'Goblin', descricao: 'Criaturas pequenas, ardilosas e desprezadas pela maioria das sociedades civilizadas.', custo: -1, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Inculto'] },
  { nome: 'Orc', descricao: 'Guerreiros brutais e ferozes, conhecidos pela fúria em batalha e sociedade tribal.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Fúria Incontrolável'] },

  // ===== Humanoides =====
  { nome: 'Anfíbio', descricao: 'Ser que vive tanto na água quanto na terra, adaptado a ambientes aquáticos.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Adaptador'], desvantagens_inclusas: [] },
  { nome: 'Alien', descricao: 'Visitante de outro mundo ou dimensão, com biologia e sentidos completamente diferentes.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Adaptador', 'Sentidos Especiais'], desvantagens_inclusas: [] },
  { nome: 'Centauro', descricao: 'Metade humano, metade cavalo. Rápido e forte, mas com dificuldades em espaços fechados.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Aceleração'], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Kemono', descricao: 'Humanoide com traços animais — orelhas, cauda, garras. Sentidos aguçados de predador.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Sentidos Especiais'], desvantagens_inclusas: [] },
  { nome: 'Meio-Dragão', descricao: 'Descendente de dragões. Asas, escamas, sopro devastador — o poder dracônico corre em suas veias.', custo: 4, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Armadura Extra', 'Voo', 'Ataque Especial'], desvantagens_inclusas: [] },
  { nome: 'Minotauro', descricao: 'Humanoides com cabeça de touro, enormes e poderosos. Mestres dos labirintos.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Arena'], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Ogro', descricao: 'Gigantes brutais e pouco inteligentes, temidos pela força descomunal.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Troglodita', descricao: 'Répteis humanoides subterrâneos, adaptados à escuridão total.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Adaptador'], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Bugbear', descricao: 'Goblins grandes e furtivos, surpreendentemente silenciosos para seu tamanho.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Sentidos Especiais'], desvantagens_inclusas: [] },
  { nome: 'Hobgoblin', descricao: 'Goblins disciplinados e militaristas, mestres da tática e da guerra organizada.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Arena'], desvantagens_inclusas: [] },
  { nome: 'Kobold', descricao: 'Pequenos répteis covardemente astutos, mestres de armadilhas.', custo: -1, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Inculto', 'Modelo Especial'] },
  { nome: 'Draconato', descricao: 'Dragões humanoides orgulhosos com sopro elemental e escamas resistentes.', custo: 3, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Armadura Extra', 'Ataque Especial'], desvantagens_inclusas: [] },
  { nome: 'Pardalino', descricao: 'Felinos humanoides ágeis e curiosos, impulsionados por sede de conhecimento.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Aceleração', 'Sentidos Especiais'], desvantagens_inclusas: [] },
  { nome: 'Silvagante', descricao: 'Gigantes gentis da floresta com conexão profunda com a natureza.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Ligação Natural'], desvantagens_inclusas: [] },
  { nome: 'Primordiano', descricao: 'Tocados pelos planos elementais, manifestam poder de fogo, água, terra ou ar na própria pele.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Elementalista'], desvantagens_inclusas: [] },

  // ===== Youkai =====
  { nome: 'Anjo', descricao: 'Ser celestial de pura luz. Asas radiantes, magias de cura e proteção divina.', custo: 3, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Voo', 'Magia Branca'], desvantagens_inclusas: [] },
  { nome: 'Demônio', descricao: 'Criatura das trevas com resistência sobrenatural. Temido e desprezado onde quer que vá.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Resistência a Magia'], desvantagens_inclusas: ['Má Fama'] },
  { nome: 'Fada', descricao: 'Ser mágico diminuto com asas translúcidas, capaz de voar e conjurar magias elementais.', custo: 3, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Voo', 'Magia Elemental'], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Licantropo', descricao: 'Amaldiçoado com a forma bestial. Pode se transformar mas luta para manter o controle.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Forma Alternativa'], desvantagens_inclusas: ['Fúria Incontrolável'] },
  { nome: 'Meio-Abissal', descricao: 'Descendente de demônios, carrega poder sombrio e resistência sobrenatural.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Resistência a Magia'], desvantagens_inclusas: [] },
  { nome: 'Meio-Celestial', descricao: 'Descendente de anjos, abençoado com luz divina e magias de proteção.', custo: 2, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Magia Branca'], desvantagens_inclusas: [] },
  { nome: 'Meio-Gênio', descricao: 'Descendente de gênios elementais, domina magia elemental e pode voar.', custo: 4, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Magia Elemental', 'Voo'], desvantagens_inclusas: [] },
  { nome: 'Deva', descricao: 'Alma reencarnada de origem divina. Carrega memórias de vidas passadas e poder sagrado.', custo: 3, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Magia Branca'], desvantagens_inclusas: [] },

  // ===== Construtos =====
  { nome: 'Androide', descricao: 'Máquina com aparência humana. Forte e resiliente, mas sem emoções verdadeiras.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Armadura Extra'], desvantagens_inclusas: [] },
  { nome: 'Ciborgue', descricao: 'Humano com partes mecânicas. Pode ser melhorado com implantes e equipamentos.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: [] },
  { nome: 'Golem', descricao: 'Construto mágico de pedra, metal ou madeira. Extremamente resistente mas sem magia própria.', custo: 3, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Armadura Extra'], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Mecha', descricao: 'Robô gigante ou armadura mecânica pilotada. Devastador em combate.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Meio-Golem', descricao: 'Ser vivo com partes de construto. Mais resistente que o normal.', custo: 1, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Armadura Extra'], desvantagens_inclusas: [] },
  { nome: 'Nanomorfo', descricao: 'Ser composto por nanomáquinas que se reestruturam. Adapta-se a qualquer situação.', custo: 3, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Regeneração', 'Adaptador'], desvantagens_inclusas: [] },
  { nome: 'Robô Positrônico', descricao: 'Máquina com inteligência artificial avançada. Segue as Leis da Robótica.', custo: -2, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Modelo Especial', 'Inculto'] },

  // ===== Mortos-vivos =====
  { nome: 'Esqueleto', descricao: 'Morto-vivo reduzido a ossos animados. Frágil mas incansável.', custo: 0, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Modelo Especial'] },
  { nome: 'Fantasma', descricao: 'Espírito que recusa partir. Intangível, invisível, capaz de voar — mas preso entre os mundos.', custo: 5, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Voo', 'Invisibilidade'], desvantagens_inclusas: [] },
  { nome: 'Múmia', descricao: 'Morto-vivo preservado por rituais antigos. Extraordinariamente resistente com poder de paralisia.', custo: 5, nivel: 1, tipo: ['racial'], vantagens_inclusas: ['Armadura Extra', 'Regeneração', 'Paralisia'], desvantagens_inclusas: [] },
  { nome: 'Vampiro', descricao: 'Morto-vivo sedutor e letal. Poderes noturnos imensos, mas fraquezas fatais à luz e estacas.', custo: -1, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Dependência de Sangue', 'Vulnerabilidade à Luz Solar'] },
  { nome: 'Zumbi', descricao: 'Cadáver reanimado, lento e inculto, mas quase impossível de parar.', custo: -2, nivel: 1, tipo: ['racial'], vantagens_inclusas: [], desvantagens_inclusas: ['Inculto', 'Lentidão', 'Modelo Especial'] },
];

export async function seedTresdetRacas() {
  console.log(`Seeding ${RACAS.length} 3D&T racial vantagens...`);
  for (const r of RACAS) {
    await prisma.vantagens.upsert({
      where: { nome_sistema: { nome: r.nome, sistema: 'tresdet' } },
      create: {
        nome: r.nome,
        descricao: r.descricao,
        custo: r.custo,
        nivel: r.nivel,
        tipo: r.tipo,
        subtipo: 'racial',
        vantagens_inclusas: r.vantagens_inclusas,
        desvantagens_inclusas: r.desvantagens_inclusas,
        sistema: 'tresdet',
      },
      update: {
        descricao: r.descricao,
        custo: r.custo,
        tipo: r.tipo,
        subtipo: 'racial',
        vantagens_inclusas: r.vantagens_inclusas,
        desvantagens_inclusas: r.desvantagens_inclusas,
      },
    });
  }
  console.log(`Done: ${RACAS.length} racas seeded.`);
}
