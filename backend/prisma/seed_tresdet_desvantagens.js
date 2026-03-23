/**
 * Seed 3D&T desvantagens — popula a tabela desvantagens com catálogo do sistema 3D&T Alpha.
 * Uso: node prisma/seed_tresdet_desvantagens.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const desvantagens = [
  {
    nome: 'Código de Honra',
    descricao: 'Você segue um rígido código de conduta. Não pode atacar inimigos desarmados, fugir de um duelo ou trair sua palavra.',
    custo: -1,
    nivel: 1,
    tipo: ['comportamental'],
    efeito: { tipo: 'restricao_comportamental', regras: ['nao_atacar_desarmados', 'nao_fugir', 'manter_palavra'] },
  },
  {
    nome: 'Maldição',
    descricao: 'Você carrega uma maldição que se manifesta de formas imprevisíveis, causando efeitos negativos recorrentes.',
    custo: -1,
    nivel: 1,
    tipo: ['sobrenatural'],
    efeito: { tipo: 'efeito_negativo_recorrente', frequencia: 'aleatoria' },
  },
  {
    nome: 'Modelo Especial',
    descricao: 'Sua aparência não é humana. Você sofre penalidades em interações sociais e chama atenção indesejada.',
    custo: -1,
    nivel: 1,
    tipo: ['social'],
    efeito: { tipo: 'penalidade_social', valor: -2, causa: 'aparencia_nao_humana' },
  },
  {
    nome: 'Inculto',
    descricao: 'Você não sabe ler nem escrever. Não pode usar pergaminhos, decifrar mapas escritos ou interpretar documentos.',
    custo: -1,
    nivel: 1,
    tipo: ['mental'],
    efeito: { tipo: 'restricao', impedimentos: ['leitura', 'escrita', 'pergaminhos'] },
  },
  {
    nome: 'Assombrado',
    descricao: 'Um espírito ou entidade sobrenatural o persegue constantemente, causando distúrbios e interferindo em momentos críticos.',
    custo: -2,
    nivel: 1,
    tipo: ['sobrenatural'],
    efeito: { tipo: 'interferencia', origem: 'espirito', momento: 'critico' },
  },
  {
    nome: 'Devoção',
    descricao: 'Você é devotado a uma causa, divindade ou ideal. Não pode recusar pedidos relacionados e deve sempre agir em prol dessa devoção.',
    custo: -1,
    nivel: 1,
    tipo: ['comportamental'],
    efeito: { tipo: 'restricao_comportamental', regras: ['nao_recusar_causa', 'priorizar_devocao'] },
  },
  {
    nome: 'Fúria',
    descricao: 'Quando sofre dano, você entra em fúria incontrolável. Ataca o inimigo mais próximo sem pensar nas consequências.',
    custo: -1,
    nivel: 1,
    tipo: ['comportamental'],
    efeito: { tipo: 'perda_controle', gatilho: 'ao_sofrer_dano', comportamento: 'atacar_mais_proximo' },
  },
  {
    nome: 'Proteger Inocentes',
    descricao: 'Você não consegue ignorar civis em perigo. Deve sempre priorizar a proteção de inocentes, mesmo que isso o coloque em risco.',
    custo: -1,
    nivel: 1,
    tipo: ['comportamental'],
    efeito: { tipo: 'restricao_comportamental', regras: ['proteger_civis', 'priorizar_inocentes'] },
  },
  {
    nome: 'Rivalidade',
    descricao: 'Você possui um rival ou inimigo declarado que aparece periodicamente para atrapalhar seus planos.',
    custo: -1,
    nivel: 1,
    tipo: ['social'],
    efeito: { tipo: 'inimigo_recorrente', frequencia: 'periodica' },
  },
  {
    nome: 'Má Fama',
    descricao: 'Sua reputação é terrível. NPCs desconfiam de você e podem recusar ajuda ou cobrar mais caro por serviços.',
    custo: -1,
    nivel: 1,
    tipo: ['social'],
    efeito: { tipo: 'penalidade_social', valor: -2, causa: 'ma_reputacao' },
  },
  {
    nome: 'Insano',
    descricao: 'Você sofre de uma condição mental severa — paranoia, esquizofrenia ou fobia extrema — que interfere em suas ações.',
    custo: -2,
    nivel: 2,
    tipo: ['mental'],
    efeito: { tipo: 'condicao_mental', severidade: 'grave', penalidade_testes: -2 },
  },
  {
    nome: 'Monstruoso',
    descricao: 'Sua aparência é genuinamente aterrorizante. Civis fogem ao vê-lo e qualquer interação social pacífica é quase impossível.',
    custo: -2,
    nivel: 2,
    tipo: ['social'],
    efeito: { tipo: 'penalidade_social', valor: -4, causa: 'aparencia_monstruosa', efeito_extra: 'civis_fogem' },
  },
  {
    nome: 'Vulnerabilidade',
    descricao: 'Você é extremamente fraco contra um elemento ou tipo de dano específico. Recebe o dobro de dano dessa fonte.',
    custo: -2,
    nivel: 2,
    tipo: ['fisica'],
    efeito: { tipo: 'vulnerabilidade', multiplicador_dano: 2, contra: 'elemento_especifico' },
  },
  // --- New narrative-heavy desvantagens ---
  {
    nome: 'Ponto Fraco',
    descricao: 'Sua técnica de luta tem uma fraqueza. Inimigos que a descobrem ganham H+1 contra você.',
    custo: -1,
    nivel: 1,
    tipo: ['combate'],
    efeito: { tipo: 'penalidade_combate', condicao: 'fraqueza_descoberta', bonus_inimigo: 'H+1' },
  },
  {
    nome: 'Protegido Indefeso',
    descricao: 'Alguém que você deve proteger com a própria vida. Vilões vão usá-lo contra você.',
    custo: -1,
    nivel: 1,
    tipo: ['narrativa'],
    efeito: { tipo: 'restricao_comportamental', regras: ['proteger_protegido', 'vulneravel_a_chantagem'] },
  },
  {
    nome: 'Cleptomaníaco',
    descricao: 'Você rouba coisas que não precisa. Teste de R para resistir quando surge oportunidade.',
    custo: -1,
    nivel: 1,
    tipo: ['psicologico'],
    efeito: { tipo: 'compulsao', gatilho: 'oportunidade_roubo', teste: 'R' },
  },
  {
    nome: 'Compulsivo',
    descricao: 'Existe algo que precisa fazer constantemente. Se ficar mais de 1h sem fazer, falha testes de R.',
    custo: -1,
    nivel: 1,
    tipo: ['psicologico'],
    efeito: { tipo: 'compulsao', gatilho: 'tempo_1h', penalidade: 'falha_testes_R' },
  },
  {
    nome: 'Mentiroso',
    descricao: 'Nunca diz a verdade. Teste de R-3 para dizer algo verdadeiro, mesmo para aliados.',
    custo: -1,
    nivel: 1,
    tipo: ['psicologico', 'social'],
    efeito: { tipo: 'compulsao', gatilho: 'falar_verdade', teste: 'R-3' },
  },
  {
    nome: 'Paranóico',
    descricao: 'Não confia em ninguém. Nunca aceita ajuda. Recupera PVs como em lugar inadequado.',
    custo: -1,
    nivel: 1,
    tipo: ['psicologico'],
    efeito: { tipo: 'restricao_comportamental', regras: ['nao_aceitar_ajuda', 'recuperacao_reduzida'] },
  },
  {
    nome: 'Megalomaníaco',
    descricao: 'Acredita ser invencível. Nunca foge, nunca se rende, ignora perigos mortais.',
    custo: -1,
    nivel: 1,
    tipo: ['psicologico'],
    efeito: { tipo: 'restricao_comportamental', regras: ['nao_fugir', 'nao_render', 'ignorar_perigo'] },
  },
  {
    nome: 'Fobia Rara',
    descricao: 'Medo terrível de algo incomum (25% do tempo). Teste de R ou foge em pânico.',
    custo: -1,
    nivel: 1,
    tipo: ['psicologico'],
    efeito: { tipo: 'fobia', frequencia: '25%', teste: 'R', falha: 'fuga_panico' },
  },
  {
    nome: 'Fobia Comum',
    descricao: 'Medo de algo encontrado frequentemente (50%). Teste de R ou foge em pânico.',
    custo: -2,
    nivel: 1,
    tipo: ['psicologico'],
    efeito: { tipo: 'fobia', frequencia: '50%', teste: 'R', falha: 'fuga_panico' },
  },
  {
    nome: 'Fobia Constante',
    descricao: 'Medo de algo quase sempre presente. Teste de R constante ou foge em pânico.',
    custo: -3,
    nivel: 1,
    tipo: ['psicologico'],
    efeito: { tipo: 'fobia', frequencia: 'constante', teste: 'R', falha: 'fuga_panico' },
  },
  {
    nome: 'Fantasia',
    descricao: 'Acredita ser alguém ou algo que não é. Anuncia sua fantasia para todos à volta.',
    custo: -1,
    nivel: 1,
    tipo: ['psicologico'],
    efeito: { tipo: 'condicao_mental', severidade: 'moderada', comportamento: 'anunciar_fantasia' },
  },
  {
    nome: 'Dupla Personalidade',
    descricao: 'Outra personalidade com características diferentes. Muda aleatoriamente (4-6 no dado).',
    custo: -2,
    nivel: 1,
    tipo: ['psicologico'],
    efeito: { tipo: 'condicao_mental', severidade: 'grave', gatilho: 'dado_4_6', comportamento: 'troca_personalidade' },
  },
  {
    nome: 'Jurado de Morte',
    descricao: 'Inimigo mortal implacável que não descansará até destruí-lo. Aparece nos piores momentos.',
    custo: -3,
    nivel: 1,
    tipo: ['narrativa'],
    efeito: { tipo: 'inimigo_recorrente', frequencia: 'piores_momentos', severidade: 'mortal' },
  },
  {
    nome: 'Maldição Hereditária',
    descricao: 'Maldição de família com efeitos recorrentes e imprevisíveis. O Mestre decide quando ataca.',
    custo: -3,
    nivel: 1,
    tipo: ['maldicao'],
    efeito: { tipo: 'efeito_negativo_recorrente', frequencia: 'decisao_mestre', origem: 'hereditaria' },
  },
  {
    nome: 'Transformação Incontrolável',
    descricao: 'Muda de forma em situações de estresse sem controle. O Mestre decide o gatilho.',
    custo: -3,
    nivel: 2,
    tipo: ['transformacao'],
    efeito: { tipo: 'perda_controle', gatilho: 'estresse', comportamento: 'transformacao_involuntaria' },
  },
  {
    nome: 'Dívida Impagável',
    descricao: 'Deve favor a alguém poderoso. Missões obrigatórias quando cobrado.',
    custo: -2,
    nivel: 1,
    tipo: ['narrativa'],
    efeito: { tipo: 'restricao_comportamental', regras: ['missoes_obrigatorias', 'favor_poderoso'] },
  },
  {
    nome: 'Exilado',
    descricao: 'Banido de sua terra natal. Sem aliados locais, perseguido se retornar.',
    custo: -1,
    nivel: 1,
    tipo: ['social'],
    efeito: { tipo: 'restricao_social', impedimentos: ['sem_aliados_locais', 'perseguido_se_retornar'] },
  },
  {
    nome: 'Identidade Oculta',
    descricao: 'Deve esconder quem realmente é. Se descoberto, consequências graves.',
    custo: -1,
    nivel: 1,
    tipo: ['narrativa'],
    efeito: { tipo: 'restricao_comportamental', regras: ['manter_disfarce', 'consequencias_se_descoberto'] },
  },
  {
    nome: 'Vício',
    descricao: 'Dependência que prejudica desempenho. -1 em testes quando em abstinência.',
    custo: -2,
    nivel: 1,
    tipo: ['fisiologico'],
    efeito: { tipo: 'penalidade_condicional', condicao: 'abstinencia', penalidade_testes: -1 },
  },
  {
    nome: 'Segredo Sombrio',
    descricao: 'Se descoberto, sua vida muda para sempre. O Mestre sabe o segredo.',
    custo: -2,
    nivel: 1,
    tipo: ['narrativa'],
    efeito: { tipo: 'restricao_comportamental', regras: ['manter_segredo', 'consequencias_graves'] },
  },
  {
    nome: 'Vingativo',
    descricao: 'Nunca perdoa. Persegue quem o ofendeu, mesmo quando irracional.',
    custo: -1,
    nivel: 1,
    tipo: ['psicologico'],
    efeito: { tipo: 'restricao_comportamental', regras: ['perseguir_ofensor', 'nao_perdoar'] },
  },
  {
    nome: 'Covarde',
    descricao: 'Teste de R para não fugir quando em desvantagem numérica ou contra inimigo forte.',
    custo: -2,
    nivel: 1,
    tipo: ['psicologico'],
    efeito: { tipo: 'compulsao', gatilho: 'desvantagem_numerica', teste: 'R', falha: 'fuga' },
  },
  {
    nome: 'Vulnerabilidade Elemental',
    descricao: 'Recebe o dobro de dano de um elemento específico escolhido na criação.',
    custo: -2,
    nivel: 1,
    tipo: ['defensiva'],
    efeito: { tipo: 'vulnerabilidade', multiplicador_dano: 2, contra: 'elemento_escolhido' },
  },
  {
    nome: 'Marca Amaldiçoada',
    descricao: 'Marca que atrai problemas, entidades malignas e azar. O Mestre usa contra você.',
    custo: -2,
    nivel: 1,
    tipo: ['maldicao'],
    efeito: { tipo: 'efeito_negativo_recorrente', frequencia: 'decisao_mestre', origem: 'marca' },
  },
];

async function main() {
  console.log(`Inserindo ${desvantagens.length} desvantagens 3D&T...`);

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
      console.error(`Erro em "${d.nome}":`, err.message);
      erros++;
    }
  }

  console.log(`Desvantagens 3D&T: ${inseridas} inseridas/atualizadas, ${erros} com erro.`);

  const total = await prisma.desvantagens.count({ where: { sistema: 'tresdet' } });
  console.log(`Total desvantagens 3D&T no banco: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
