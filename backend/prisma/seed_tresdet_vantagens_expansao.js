/**
 * Seed 3D&T vantagens/desvantagens expansão — adiciona entradas do manual base ainda ausentes.
 * Uso: node prisma/seed_tresdet_vantagens_expansao.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vantagens = [
  {
    nome: 'Genialidade',
    descricao: 'Sua mente trabalha muito acima da média: ganha H+2 nos testes com as perícias que domina e também nos testes de Habilidade que dependam de uma perícia que você não tem.',
    custo: 1,
    nivel: 1,
    tipo: ['passiva'],
    usar: 0,
    efeito: { tipo: 'bonus', bonus: { H: 2 }, condicao: 'pericias' },
  },
  {
    nome: 'Invulnerabilidade',
    descricao: 'Um tipo de dano quase não o afeta: a FA desse tipo é dividida por 10 antes da comparação com a sua FD. Opções: Corte, Perfuração, Esmagamento, Fogo, Frio, Elétrico, Químico, Sônico, Força, Poder de Fogo ou Magia. Não se compra com pontos; só vem de vantagem única ou de item mágico.',
    custo: 0,
    nivel: 1,
    tipo: ['defensiva', 'especial'],
    usar: 0,
    efeito: { tipo: 'invulnerabilidade', divisor: 10 },
  },
  {
    nome: 'Magia Irresistível',
    descricao: 'Suas magias são mais duras de resistir: o alvo sofre um redutor no teste de Resistência igual ao custo pago (-1 por 1 ponto, -2 por 2 pontos, -3 por 3 pontos).',
    custo: 1,
    nivel: 3,
    tipo: ['magico'],
    usar: 0,
    efeito: { tipo: 'redutor_resistencia', por_nivel: -1 },
  },
  {
    nome: 'Memória Expandida',
    descricao: 'Nada do que você percebe pelos sentidos é esquecido. Aprende perícias só de ver alguém praticá-las e dispensa testes ao estudar magias novas.',
    custo: 2,
    nivel: 1,
    tipo: ['passiva'],
    usar: 0,
    efeito: { tipo: 'memoria', aprender_pericias: true, aprender_magias_auto: true },
  },
  {
    nome: 'Telepatia',
    descricao: 'Ler pensamentos (H+2 em perícias sociais), analisar poder de combate, revelar tesouro, prever movimentos (+1 iniciativa e esquivas). Cada uso custa 2 PMs. Só funciona com criaturas vivas com R não superior à sua H.',
    custo: 1,
    nivel: 1,
    tipo: ['magico', 'controle'],
    usar: 1,
    efeito: { tipo: 'telepatia', custo_pm: 2, bonus_social: 2, bonus_iniciativa: 1 },
  },
  {
    nome: 'Toque de Energia',
    descricao: 'Seu toque descarrega energia com FA = A + 1d + PMs gastos contra alvos ao alcance corpo-a-corpo. O tipo de energia é definido ao comprar a vantagem, e o máximo de PMs por uso é igual à sua Armadura.',
    custo: 1,
    nivel: 1,
    tipo: ['ofensiva'],
    usar: 1,
    efeito: { tipo: 'toque_energia', formula: 'A+1d+PMs' },
  },
];

const desvantagens = [
  {
    nome: 'Ambiente Especial',
    descricao: 'Você precisa de um ambiente específico (água, frio ártico ou similar). Depois de R dias longe dele, perde 1 ponto de F e 1 de R a cada dia. Passar 24h no seu ambiente natural recupera as perdas.',
    custo: -1,
    nivel: 1,
    tipo: ['fisiologico'],
    efeito: { tipo: 'dependencia_ambiental', perda_diaria: { F: 1, R: 1 }, restaura_em: '24h' },
  },
  {
    nome: 'Bateria',
    descricao: 'Reserva de energia de 2 horas por ponto de R. Ao esgotar, perde 1 F e 1 R por hora. Se ambas chegarem a 0, desliga por 1d horas. Recarrega com repouso absoluto.',
    custo: -1,
    nivel: 1,
    tipo: ['fisiologico'],
    efeito: { tipo: 'bateria', horas_por_R: 2, perda_ao_esgotar: { F: 1, R: 1 }, recarga: 'repouso_absoluto' },
  },
  {
    nome: 'Deficiência Física',
    descricao: 'Limitação física: Audição Ruim (0 pts, H-1 para notar escondidos), Cego (-2 pts, H-1 corpo, H-3 distância), Mudo (-1 pt, sem lançar magias exceto silenciosas), Sem Faro (0 pts), Surdo (-1 pt, H-1 para notar escondidos), Visão Ruim (0 pts, H-1 distância).',
    custo: -1,
    nivel: 1,
    tipo: ['fisica'],
    efeito: { tipo: 'deficiencia_fisica', variantes: ['audicao_ruim', 'cego', 'mudo', 'sem_faro', 'surdo', 'visao_ruim'] },
  },
  {
    nome: 'Dependência',
    descricao: 'Você depende de algo raro ou desumano. Deve satisfazê-la todo dia ou sofre -1 cumulativo em R (reduz PVs e PMs). Se R chegar a 0, terá 1 PV e 1 dia de vida.',
    custo: -2,
    nivel: 1,
    tipo: ['fisiologico'],
    efeito: { tipo: 'dependencia', frequencia: 'diaria', penalidade: { R: -1, cumulativo: true }, limite: 'R=0: 1PV, 1 dia de vida' },
  },
  {
    nome: 'Fetiche',
    descricao: 'Precisa de um objeto especial para canalizar magia. Sem ele, não pode usar magia. Ao sofrer dano, teste de H ou o fetiche cai. Fetiche improvisado: magias custam o dobro de PMs.',
    custo: -1,
    nivel: 1,
    tipo: ['magico'],
    efeito: { tipo: 'fetiche', sem_fetiche: 'sem_magia', fetiche_improvisado: 'PM_dobro', perda_ao_dano: true, teste: 'H' },
  },
  {
    nome: 'Interferência',
    descricao: 'Você gera um campo que atrapalha aparelhos eletrônicos num raio de 10m por PV. Dentro dele, Adaptador, Memória Expandida e Sentidos Especiais param de funcionar.',
    custo: 0,
    nivel: 1,
    tipo: ['sobrenatural'],
    efeito: { tipo: 'interferencia_eletronica', raio: '10m_por_PV', afeta: ['eletronicos', 'Adaptador', 'Memoria_Expandida', 'Sentidos_Especiais'] },
  },
  {
    nome: 'Interferência Mágica',
    descricao: 'Uma aura antimágica envolve você e atrapalha quem tenta conjurar por perto. Para cada magia lançada a até 10m, o mestre rola 1d: resultado 1 ou 2 faz a magia falhar. O conjurador pode pagar 1 PM a mais para escapar do efeito.',
    custo: 0,
    nivel: 1,
    tipo: ['sobrenatural'],
    efeito: { tipo: 'interferencia_magica', raio: '10m', falha_em: [1, 2], custo_ignorar: 1 },
  },
  {
    nome: 'Munição Limitada',
    descricao: 'Seu PdF tem munição limitada: 3 × PdF tiros. Ao esgotar, precisa comprar ou fabricar mais.',
    custo: -1,
    nivel: 1,
    tipo: ['combate'],
    efeito: { tipo: 'municao_limitada', formula: '3x_PdF', recarga: 'comprar_ou_fabricar' },
  },
  {
    nome: 'Restrição de Poder',
    descricao: 'É mais difícil usar seus poderes em certas condições. Precisa gastar duas vezes mais PMs. Custo: -1 (incomum, 25% do tempo), -2 (comum, 50%), -3 (muito comum, quase sempre).',
    custo: -1,
    nivel: 1,
    tipo: ['magico'],
    efeito: { tipo: 'restricao_poder', custo_extra_pm: 2, niveis: [{ custo: -1, frequencia: '25%' }, { custo: -2, frequencia: '50%' }, { custo: -3, frequencia: 'quase_sempre' }] },
  },
];

async function seedVantagens() {
  console.log(`Inserindo ${vantagens.length} vantagens 3D&T (expansão)...`);

  let inseridas = 0;
  let erros = 0;

  for (const v of vantagens) {
    try {
      await prisma.vantagens.upsert({
        where: { nome_sistema: { nome: v.nome, sistema: 'tresdet' } },
        create: {
          nome: v.nome,
          descricao: v.descricao,
          custo: v.custo,
          nivel: v.nivel,
          tipo: v.tipo,
          usar: v.usar,
          efeito: v.efeito ?? null,
          subtipo: null,
          sistema: 'tresdet',
        },
        update: {
          descricao: v.descricao,
          custo: v.custo,
          nivel: v.nivel,
          tipo: v.tipo,
          usar: v.usar,
          efeito: v.efeito ?? null,
          subtipo: null,
        },
      });
      inseridas++;
    } catch (err) {
      console.error(`Erro em vantagem "${v.nome}":`, err.message);
      erros++;
    }
  }

  console.log(`Vantagens 3D&T: ${inseridas} inseridas/atualizadas, ${erros} com erro.`);

  const total = await prisma.vantagens.count({ where: { sistema: 'tresdet' } });
  console.log(`Total vantagens 3D&T no banco: ${total}`);
}

async function seedDesvantagens() {
  console.log(`Inserindo ${desvantagens.length} desvantagens 3D&T (expansão)...`);

  let inseridas = 0;
  let erros = 0;

  for (const d of desvantagens) {
    try {
      await prisma.desvantagens.upsert({
        where: { nome_sistema: { nome: d.nome, sistema: 'tresdet' } },
        create: {
          nome: d.nome,
          descricao: d.descricao,
          custo: d.custo,
          nivel: d.nivel,
          tipo: d.tipo,
          usar: 0,
          efeito: d.efeito,
          sistema: 'tresdet',
        },
        update: {
          descricao: d.descricao,
          custo: d.custo,
          nivel: d.nivel,
          tipo: d.tipo,
          usar: 0,
          efeito: d.efeito,
        },
      });
      inseridas++;
    } catch (err) {
      console.error(`Erro em desvantagem "${d.nome}":`, err.message);
      erros++;
    }
  }

  console.log(`Desvantagens 3D&T: ${inseridas} inseridas/atualizadas, ${erros} com erro.`);

  const total = await prisma.desvantagens.count({ where: { sistema: 'tresdet' } });
  console.log(`Total desvantagens 3D&T no banco: ${total}`);
}

async function main() {
  await seedVantagens();
  await seedDesvantagens();
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
