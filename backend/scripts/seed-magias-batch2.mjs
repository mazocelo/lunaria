/**
 * seed-magias-batch2.mjs — Insere batch 2 de magias 3D&T na tabela magias_tresdet.
 * Upsert por nome para evitar duplicatas.
 *
 * Uso: node scripts/seed-magias-batch2.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ALL_FOCUSES = [{ fogo: 1 }, { agua: 1 }, { terra: 1 }, { ar: 1 }, { luz: 1 }, { trevas: 1 }];

function focusLevel(custoStr) {
  const match = custoStr.match(/(\d+)/);
  if (!match) return 1;
  const base = parseInt(match[1], 10);
  if (base <= 3) return 1;
  if (base <= 10) return 2;
  if (base <= 20) return 3;
  if (base <= 40) return 4;
  return 5;
}

function buildFocus(escola, nivel) {
  const e = escola.toLowerCase();

  if (e === 'todas' || e === 'branca elemental e negra (todas)') {
    return ALL_FOCUSES.map(f => {
      const key = Object.keys(f)[0];
      return { [key]: nivel };
    });
  }

  const parts = [];

  if (e.includes('branca')) parts.push({ luz: nivel });
  if (e.includes('negra')) parts.push({ trevas: nivel });
  if (e.includes('fogo')) parts.push({ fogo: nivel });
  if (e.includes('agua')) parts.push({ agua: nivel });
  if (e.includes('ar')) parts.push({ ar: nivel });
  if (e.includes('terra')) parts.push({ terra: nivel });
  if (e.includes('espirito')) {
    parts.push({ luz: nivel });
    parts.push({ trevas: nivel });
  }

  if (parts.length === 0) {
    return ALL_FOCUSES.map(f => {
      const key = Object.keys(f)[0];
      return { [key]: nivel };
    });
  }

  const seen = new Set();
  return parts.filter(p => {
    const key = JSON.stringify(p);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const magias = [
  {
    nome: 'Ilusao',
    descricao: 'Gera imagens irreais de coisas que o mago ja viu ou conhece, sem som e sem cheiro. Custo pelo tamanho: 1PM para um objeto pequeno, 5PM para algo do porte de um cavalo, 10PM para uma montanha.',
    escola: 'todas',
    custo_pm: '1 PM ou mais',
    alcance: 'longo',
    duracao: 'sustentavel',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Ilusao Avancada',
    descricao: 'Como Ilusao mas produz sons e cheiros. Pode causar dano. Consome 4x mais PMs.',
    escola: 'todas',
    custo_pm: '2 PMs ou mais',
    alcance: 'longo',
    duracao: 'sustentavel',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Ilusao Total',
    descricao: 'A mais eficiente ilusao. Imagem solida que engana todos os sentidos. Pode causar dano ilusorio.',
    escola: 'todas',
    custo_pm: '4 PMs ou mais',
    alcance: 'longo',
    duracao: 'sustentavel',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Imagem Turva',
    descricao: 'Deixa os contornos de uma criatura borrados e dificeis de distinguir: quem a enfrenta sofre -1 em Habilidade tanto no ataque quanto na defesa.',
    escola: 'Branca ou Negra',
    custo_pm: '3 PMs',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'defesa',
    exigencias: null,
  },
  {
    nome: 'Impulso',
    descricao: 'Enche a vitima de motivacao e coragem. Recebe +1 em iniciativa mas -1 em Armadura e Resistencia.',
    escola: 'Elemental (espirito)',
    custo_pm: '2 PMs',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'buff',
    exigencias: null,
  },
  {
    nome: 'Inferno de Gelo',
    descricao: 'Dispara salva de pontas de gelo afiadas. Ataca com FA=H+2d, ignora totalmente Armadura do alvo.',
    escola: 'Branca ou Elemental (agua)',
    custo_pm: '5 PMs',
    alcance: 'curto',
    duracao: 'instantanea',
    tipo: 'dano',
    exigencias: null,
  },
  {
    nome: 'Invisibilidade',
    descricao: 'Torna objetos e criaturas invisiveis. Atacar cancela. Impoe penalidade H-1 ao atacante.',
    escola: 'todas',
    custo_pm: '1 PM ou mais',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Invisibilidade Superior',
    descricao: 'Similar a Invisibilidade mas nao e cancelada ao atacar. Custa 2x mais PMs.',
    escola: 'todas',
    custo_pm: '2 PMs ou mais',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Invulnerabilidade',
    descricao: 'Concede Invulnerabilidade a um tipo especifico de dano. Corte/Perfuracao/Esmagamento=2PM, Fogo/Frio/Eletrico=4PM, Magia/Forca/PdF=6PM.',
    escola: 'todas',
    custo_pm: '2 a 6 PMs por turno',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'defesa',
    exigencias: null,
  },
  {
    nome: 'Lagrimas de Lyrrin',
    descricao: 'Reducao de habilidades de ladrao em aposentos protegidos. Testes de Crime sao Dificeis.',
    escola: 'Branca',
    custo_pm: '3 PMs',
    alcance: 'toque',
    duracao: 'permanente ate cancelada',
    tipo: 'controle',
    exigencias: 'Clericato',
  },
  {
    nome: "Lamina d'Agua",
    descricao: 'Cria lamina de agua sob altissima pressao que corta como arma vorpal. FA=H+1d+10.',
    escola: 'Elemental (agua) ou Negra',
    custo_pm: '10 PMs',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'dano',
    exigencias: null,
  },
  {
    nome: 'Leitura de Labios',
    descricao: 'Permite ouvir as palavras de qualquer criatura em campo de visao. Util para espionagem e aprender magias.',
    escola: 'Branca ou Elemental (ar)',
    custo_pm: '1 PM',
    alcance: 'longo',
    duracao: 'sustentavel',
    tipo: 'suporte',
    exigencias: null,
  },
  {
    nome: 'Luz',
    descricao: 'Um objeto tocado brilha como tocha, iluminando 6m de raio. Pode ser lancado sobre objeto movel.',
    escola: 'Branca ou Elemental (fogo)',
    custo_pm: '1 PM',
    alcance: 'toque',
    duracao: 'sustentavel',
    tipo: 'suporte',
    exigencias: null,
  },
  {
    nome: 'Maldicao das Trevas',
    descricao: 'Drena PMs permanentemente e impoe Maldicao sobre a vitima. 5PM=infima, 10PM=suave(-1pt), 15PM=grave(-2pt).',
    escola: 'Negra',
    custo_pm: '5 a 15 PMs permanentes',
    alcance: 'visao',
    duracao: 'permanente',
    tipo: 'debuff',
    exigencias: null,
  },
  {
    nome: 'Marcha da Batalha',
    descricao: 'Musica vibrante que da FA+1 e FD+1 para cada 2 PMs gastos a todos os aliados na area.',
    escola: 'Branca ou Elemental (espirito)',
    custo_pm: '2 a 10 PMs por turno',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'buff',
    exigencias: null,
  },
  {
    nome: 'Marcha da Coragem',
    descricao: 'Impede aliados de serem afetados por medo, natural ou magico. Cancela Panico.',
    escola: 'Branca ou Elemental (espirito)',
    custo_pm: '1 PM',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'buff',
    exigencias: null,
  },
  {
    nome: 'Marionete',
    descricao: 'Controla totalmente o corpo de uma criatura. Teste de Resistencia -1 para resistir.',
    escola: 'Elemental (terra) ou Negra',
    custo_pm: '10 PMs por hora',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Mata-Dragao',
    descricao: 'Uma das mais poderosas magias de destruicao. Dispara carga de energia explosiva com FA=H+2d+30 que destroi tudo ate 100m. Leva 2 turnos.',
    escola: 'Negra',
    custo_pm: '30 PMs',
    alcance: 'longo',
    duracao: 'instantanea',
    tipo: 'dano',
    exigencias: null,
  },
  {
    nome: 'Agigantar',
    descricao: 'Torna criatura maior e mais forte. Cada 5 PMs aumentam tamanho 50% e concedem F+1, R+1, PdF+1.',
    escola: 'Elemental (agua ou terra)',
    custo_pm: '5 PMs por turno',
    alcance: 'toque',
    duracao: 'sustentavel',
    tipo: 'buff',
    exigencias: null,
  },
  {
    nome: 'Mikron',
    descricao: 'Oposto de Agigantar. Reduz tamanho 50% e penaliza F-1, R-1, PdF-1 a cada 5 PMs.',
    escola: 'Elemental (agua ou terra)',
    custo_pm: '5 PMs',
    alcance: 'toque',
    duracao: 'permanente ate cancelada',
    tipo: 'debuff',
    exigencias: null,
  },
  {
    nome: 'Morte Estelar',
    descricao: 'A mais poderosa magia destrutiva. FA infinita, destroi qualquer coisa sem teste. Sacrifica 5 PMs permanentes.',
    escola: 'Branca Elemental e Negra (todas)',
    custo_pm: '5 PMs permanentes',
    alcance: 'longo',
    duracao: 'instantanea',
    tipo: 'dano',
    exigencias: 'Arcano',
  },
  {
    nome: 'Mundo dos Sonhos',
    descricao: 'Faz a vitima acreditar que esta em outra realidade controlada pelo mago. Nenhum dano real.',
    escola: 'Elemental (espirito)',
    custo_pm: '2 PMs por alvo',
    alcance: 'longo',
    duracao: 'sustentavel por 1 hora',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Muralha de Energia',
    descricao: 'Barreira invisivel e indestrutivel. 3m de altura/largura por cada 4 PMs. Imune a qualquer dano e magia.',
    escola: 'Elemental (espirito)',
    custo_pm: '4 PMs ou mais',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'defesa',
    exigencias: null,
  },
  {
    nome: 'Nevasca',
    descricao: 'Cria tempestade de gelo em area de 30m que reduz visibilidade e velocidade pela metade. Apaga chamas.',
    escola: 'Elemental (agua)',
    custo_pm: '5 PMs',
    alcance: 'longo',
    duracao: 'sustentavel',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Nevoa',
    descricao: 'Cria nevoa espessa com 5m de raio por PM. Criaturas dentro sofrem H-2 para ataques a distancia.',
    escola: 'Elemental (ar)',
    custo_pm: '2 a 10 PMs',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Ondas de Vento',
    descricao: 'Conjura ondas de choque invisiveis (1 por cada 2 PMs). Cada uma ataca com FA=H+1d e alvos ficam indefesos.',
    escola: 'Elemental (ar)',
    custo_pm: '2 a 10 PMs',
    alcance: 'longo',
    duracao: 'instantanea',
    tipo: 'dano',
    exigencias: null,
  },
  {
    nome: 'Panico',
    descricao: 'Alvos devem fazer teste de Resistencia. Quem falha fica apavorado e foge. Dragoes e mortos-vivos sao imunes.',
    escola: 'Negra',
    custo_pm: '2 PMs por criatura',
    alcance: 'longo',
    duracao: 'sustentavel',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Paralisia',
    descricao: 'Magia pacificadora que paralisa a vitima indefesa. Resistencia superior a Habilidade do mago e imune.',
    escola: 'Branca ou Negra',
    custo_pm: '2 PMs por criatura',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Paz de Seraya',
    descricao: 'Anula intencoes violentas em area de 50m. Util para interromper tumultos. Nao funciona contra viloes determinados.',
    escola: 'Branca',
    custo_pm: '10 PMs',
    alcance: 'longo',
    duracao: 'sustentavel',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Permanencia',
    descricao: 'Torna permanente qualquer magia sustentavel sem manter PMs presos. Sacrifica metade dos PMs originais permanentemente.',
    escola: 'Elemental (terra)',
    custo_pm: '1 a 5 PMs permanentes',
    alcance: 'curto',
    duracao: 'permanente ate cancelada',
    tipo: 'suporte',
    exigencias: null,
  },
  {
    nome: 'Petrificacao',
    descricao: 'Transforma criaturas em pedra. Pode ser lancada por contato visual ou toque. Teste de Resistencia para negar.',
    escola: 'Elemental (terra)',
    custo_pm: '5 PMs',
    alcance: 'toque',
    duracao: 'permanente ate cancelada',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Porta Dimensional',
    descricao: 'Transporta o conjurador e criaturas tocando ate 150m. Nao transporta cargas.',
    escola: 'Elemental (espirito)',
    custo_pm: '5 PMs',
    alcance: 'pessoal',
    duracao: 'instantanea',
    tipo: 'movimento',
    exigencias: null,
  },
  {
    nome: 'Protecao Magica',
    descricao: 'Cria escudo protetor que reduz dano de magia. A+1 para cada 2 PMs gastos.',
    escola: 'todas',
    custo_pm: '2 a 10 PMs por turno',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'defesa',
    exigencias: null,
  },
  {
    nome: 'Protecao Magica Superior',
    descricao: 'Versao mais eficaz. A+1 para cada 1 PM gasto.',
    escola: 'Branca',
    custo_pm: '1 a 5 PMs por turno',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'defesa',
    exigencias: null,
  },
  {
    nome: 'Raio Desintegrador',
    descricao: 'Destroi por completo um objeto ou criatura reduzindo a nada. Cada 5 PMs desintegra Forca 1. Nao afeta fogo, eletricidade ou energia.',
    escola: 'Elemental (ar) ou Negra',
    custo_pm: '5 a 25 PMs',
    alcance: 'toque ou longo',
    duracao: 'instantanea',
    tipo: 'dano',
    exigencias: null,
  },
  {
    nome: 'Raio Eletrico',
    descricao: 'Rajada eletrica. Arma ataca com F+H+1d+PMs gastos. Pode lancar raio a 3 PMs contra inimigo com teste de Resistencia ou paralisia por 1d rodadas.',
    escola: 'Elemental (ar)',
    custo_pm: '1 a 10 PMs',
    alcance: 'curto',
    duracao: 'instantanea ou sustentavel',
    tipo: 'dano',
    exigencias: null,
  },
  {
    nome: 'Recuperacao',
    descricao: 'Magia de cura que nao exige Clericato. 1d PMs do conjurador sao usados para restaurar a mesma quantidade de PVs.',
    escola: 'Branca',
    custo_pm: '5 PMs',
    alcance: 'toque',
    duracao: 'instantanea',
    tipo: 'cura',
    exigencias: null,
  },
  {
    nome: 'Recuperacao Natural',
    descricao: 'Similar a Recuperacao mas absorve energia das pessoas e criaturas proximas. A vitima recobra 1 PV por turno.',
    escola: 'Branca',
    custo_pm: '5 PMs',
    alcance: 'toque',
    duracao: 'instantanea',
    tipo: 'cura',
    exigencias: null,
  },
  {
    nome: 'Reflexos',
    descricao: 'Cria 1d duplicatas ilusorias do mago. Cada imagem tem FD igual a Habilidade do mago e desaparece ao ser atingida.',
    escola: 'Branca ou Negra',
    custo_pm: '2 PMs',
    alcance: 'pessoal',
    duracao: 'sustentavel',
    tipo: 'defesa',
    exigencias: null,
  },
  {
    nome: 'Ressurreicao',
    descricao: 'Devolve a vida a qualquer criatura que tenha morrido por causas nao naturais. Sacrifica 1 PM permanente.',
    escola: 'Branca',
    custo_pm: '1 PM permanente',
    alcance: 'toque',
    duracao: 'instantanea',
    tipo: 'cura',
    exigencias: 'Clericato',
  },
  {
    nome: 'Sacrificio do Heroi',
    descricao: 'Tatica de ultimo recurso. PVs restaurados ao maximo, bonus +3 em F, H e A. Apos a duracao, o paladino morre permanentemente.',
    escola: 'Branca',
    custo_pm: '0',
    alcance: 'pessoal',
    duracao: '1d+2 turnos',
    tipo: 'buff',
    exigencias: 'Paladino',
  },
  {
    nome: 'Silencio',
    descricao: 'Cria area esferica com 3m de raio por cada 2 PMs onde nenhum som existe. Impossivel realizar magias dentro.',
    escola: 'Branca ou Elemental (ar)',
    custo_pm: '2 a 10 PMs',
    alcance: 'curto',
    duracao: 'permanente ate cancelada',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Sono',
    descricao: 'Versao mais poderosa de Desmaio. Vitimas adormecem profundamente. Teste de Resistencia +1.',
    escola: 'Elemental (espirito)',
    custo_pm: '3 PMs ou mais por criatura',
    alcance: 'longo',
    duracao: 'sustentavel',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Teleportacao',
    descricao: 'O mago desaparece de um lugar e reaparece em outro. Sem limite de distancia se conhecer o destino.',
    escola: 'Branca Elemental (ar) ou Negra',
    custo_pm: '2 PMs por criatura',
    alcance: 'veja adiante',
    duracao: 'instantanea',
    tipo: 'movimento',
    exigencias: null,
  },
  {
    nome: 'Tempestade Explosiva',
    descricao: 'A mais poderosa magia Elemental de fogo. Ate 2d esferas de luz aniquiladoras com FA=10d cada, ignorando Armadura.',
    escola: 'Elemental (fogo)',
    custo_pm: '60 PMs',
    alcance: 'longo',
    duracao: 'instantanea',
    tipo: 'dano',
    exigencias: null,
  },
  {
    nome: 'Terremoto',
    descricao: 'Versao mais destrutiva de Explosao. FA=2d+4 para cada 4 PMs. Dano reduz 1d+2 para cada 10m de distancia.',
    escola: 'Elemental (fogo ou terra)',
    custo_pm: '4 a 40 PMs',
    alcance: 'longo',
    duracao: 'instantanea',
    tipo: 'dano',
    exigencias: null,
  },
  {
    nome: 'Transformacao',
    descricao: 'Transforma criaturas em outras criaturas ou objetos. Custo depende de dificuldade. Todas tem ponto fraco.',
    escola: 'Branca Elemental (agua ou terra) ou Negra',
    custo_pm: '5 a 40 PMs',
    alcance: 'toque',
    duracao: 'permanente ate cancelada',
    tipo: 'controle',
    exigencias: null,
  },
  {
    nome: 'Transporte',
    descricao: 'O mago usa magia como meio de transporte. 2PM=100kg a 10m/s. Cada 2 PMs extras dobram peso ou velocidade. Nao permite voar alto.',
    escola: 'todas',
    custo_pm: '2 a 10 PMs',
    alcance: 'curto',
    duracao: 'sustentavel',
    tipo: 'movimento',
    exigencias: null,
  },
  {
    nome: 'Tropas de Grokhar',
    descricao: 'Invoca goblinoides para lutar. 2PM=goblins, 8PM=hobgoblins, 20PM=bugbears com FA=3d.',
    escola: 'Elemental (fogo ou terra) ou Negra',
    custo_pm: '2 a 20 PMs',
    alcance: 'longo',
    duracao: 'sustentavel',
    tipo: 'invocacao',
    exigencias: null,
  },
  {
    nome: 'Vinganca de Elarith',
    descricao: 'Reduz PVs do mago a 0 exigindo Teste de Morte. Todos adversarios a 10m sao atingidos por flechas magicas com FA=3d.',
    escola: 'Negra',
    custo_pm: '10 PMs',
    alcance: 'curto',
    duracao: 'instantanea',
    tipo: 'dano',
    exigencias: null,
  },
];

async function main() {
  console.log('\n── seed-magias-batch2: inserindo 50 magias 3D&T ──\n');

  let inserted = 0;
  let updated = 0;

  for (const m of magias) {
    const nivel = focusLevel(m.custo_pm);
    const focus = buildFocus(m.escola, nivel);

    const data = {
      descricao: m.descricao,
      escola: m.escola,
      custo_pm: m.custo_pm,
      alcance: m.alcance,
      duracao: m.duracao,
      tipo: m.tipo,
      exigencias: m.exigencias,
      focus_requisito: focus,
      nivel_minimo: 1,
    };

    const result = await prisma.magias_tresdet.upsert({
      where: { nome: m.nome },
      update: data,
      create: { nome: m.nome, ...data },
    });

    const isNew = result.nome === m.nome;
    if (isNew) inserted++;
    console.log(`  ✓ ${m.nome} (focus: ${JSON.stringify(focus)})`);
  }

  const total = await prisma.magias_tresdet.count();
  console.log(`\n── Batch 2 concluido: ${magias.length} magias processadas ──`);
  console.log(`── Total de magias na tabela: ${total} ──\n`);
}

main()
  .catch((err) => {
    console.error('Erro ao inserir magias:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
