/**
 * Seed 3D&T monstros — popula monstros e atributos_monstro para o sistema 3D&T Alpha.
 * Uso: node prisma/seed_tresdet_monstros.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const monstros = [
  { nome: 'Goblin', descricao: 'Criatura baixa e traiçoeira que ataca em bandos, usando armadilhas e emboscadas para compensar sua fraqueza.', F: 1, H: 2, R: 1, A: 1, PdF: 0, nivel_min: 1, nivel_max: 3 },
  { nome: 'Esqueleto', descricao: 'Morto-vivo básico reanimado por magia negra. Obedece cegamente seu mestre e luta sem medo ou dor.', F: 1, H: 1, R: 1, A: 1, PdF: 0, nivel_min: 1, nivel_max: 3 },
  { nome: 'Lobo', descricao: 'Predador ágil e feroz que caça em matilha. Seus ataques coordenados surpreendem até guerreiros experientes.', F: 2, H: 2, R: 1, A: 0, PdF: 0, nivel_min: 1, nivel_max: 3 },
  { nome: 'Orc', descricao: 'Guerreiro brutal de pele esverdeada. Valoriza a força bruta acima de tudo e vive para o combate.', F: 3, H: 1, R: 2, A: 2, PdF: 0, nivel_min: 2, nivel_max: 5 },
  { nome: 'Troll', descricao: 'Criatura gigantesca com regeneração natural. Seus ferimentos se fecham em segundos, tornando-o quase imparável.', F: 4, H: 1, R: 3, A: 2, PdF: 0, nivel_min: 3, nivel_max: 6 },
  { nome: 'Dragão Jovem', descricao: 'Dragão no início da vida, já temível. Cospe chamas devastadoras e voa com agilidade impressionante.', F: 4, H: 3, R: 4, A: 4, PdF: 4, nivel_min: 5, nivel_max: 10 },
  { nome: 'Aranha Gigante', descricao: 'Aracnídeo monstruoso cujo veneno paralisa suas vítimas. Tece teias enormes para emboscar presas desavisadas.', F: 2, H: 3, R: 2, A: 1, PdF: 1, nivel_min: 2, nivel_max: 5 },
  { nome: 'Zumbi', descricao: 'Cadáver reanimado lento mas incrivelmente resistente. Avança sem parar até ser completamente destruído.', F: 2, H: 0, R: 2, A: 1, PdF: 0, nivel_min: 1, nivel_max: 3 },
  { nome: 'Bandido', descricao: 'Ladrão de estrada que embosca viajantes em caminhos perigosos. Covarde sozinho, perigoso em grupo.', F: 1, H: 2, R: 1, A: 1, PdF: 1, nivel_min: 1, nivel_max: 3 },
  { nome: 'Elemental de Fogo', descricao: 'Ser composto inteiramente de chamas vivas. Incendeia tudo que toca e é imune a fogo.', F: 3, H: 2, R: 3, A: 2, PdF: 3, nivel_min: 4, nivel_max: 7 },
  { nome: 'Golem de Pedra', descricao: 'Construto implacável feito de rocha encantada. Incrivelmente forte e resistente, mas lento como uma montanha.', F: 5, H: 0, R: 5, A: 5, PdF: 0, nivel_min: 5, nivel_max: 8 },
  { nome: 'Vampiro', descricao: 'Morto-vivo aristocrático que se alimenta de sangue. Charmoso e letal, combina habilidade marcial com poderes sombrios.', F: 3, H: 4, R: 3, A: 2, PdF: 2, nivel_min: 5, nivel_max: 9 },
  { nome: 'Lich', descricao: 'Mago morto-vivo supremo que alcançou a imortalidade através de rituais proibidos. Seu poder arcano é devastador.', F: 2, H: 3, R: 4, A: 3, PdF: 5, nivel_min: 7, nivel_max: 10 },
  { nome: 'Mímico', descricao: 'Criatura traiçoeira que se disfarça de objetos mundanos como baús e portas. Ataca quando a vítima se aproxima.', F: 2, H: 3, R: 2, A: 3, PdF: 0, nivel_min: 3, nivel_max: 6 },
  { nome: 'Slime', descricao: 'Massa gelatinosa e ácida que dissolve tudo que absorve. Aparentemente inofensivo, mas corrosivo ao toque.', F: 1, H: 0, R: 3, A: 0, PdF: 0, nivel_min: 1, nivel_max: 3 },
];

const ATRIBUTOS_3DT = ['F', 'H', 'R', 'A', 'PdF'];

async function main() {
  console.log(`Inserindo ${monstros.length} monstros 3D&T...`);

  let inseridos = 0;
  let erros = 0;

  for (const m of monstros) {
    try {
      const hp_base = m.R * 5;
      const ataque_base = m.F + m.H;
      const defesa_base = m.A + m.H;

      const monstro = await prisma.monstros.upsert({
        where: { nome_sistema: { nome: m.nome, sistema: 'tresdet' } },
        create: {
          nome: m.nome,
          descricao: m.descricao,
          sistema: 'tresdet',
          hp_base,
          ataque_base,
          defesa_base,
          dano_base: '1d6',
          nivel_min: m.nivel_min,
          nivel_max: m.nivel_max,
          xp_base: (m.F + m.H + m.R + m.A + m.PdF) * 10,
        },
        update: {
          descricao: m.descricao,
          hp_base,
          ataque_base,
          defesa_base,
          dano_base: '1d6',
          nivel_min: m.nivel_min,
          nivel_max: m.nivel_max,
          xp_base: (m.F + m.H + m.R + m.A + m.PdF) * 10,
        },
      });

      for (const attr of ATRIBUTOS_3DT) {
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

  console.log(`Monstros 3D&T: ${inseridos} inseridos/atualizados, ${erros} com erro.`);

  const totalMonstros = await prisma.monstros.count({ where: { sistema: 'tresdet' } });
  const totalAtributos = await prisma.atributos_monstro.count({
    where: { monstros: { sistema: 'tresdet' } },
  });
  console.log(`Total monstros 3D&T: ${totalMonstros}, atributos: ${totalAtributos}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
