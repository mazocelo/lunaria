/**
 * Seed 3D&T vantagens — popula a tabela vantagens com catálogo do sistema 3D&T Alpha.
 * Uso: node prisma/seed_tresdet_vantagens.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vantagens = [
  // Combat
  {
    nome: 'Ataque Especial',
    descricao: 'Você possui um ataque devastador que causa dano extra. Ao declarar uso, adiciona +1d6 ao dano de um tipo de ataque escolhido na criação.',
    custo: 1,
    nivel: 1,
    tipo: ['ofensiva'],
    usar: 1,
    efeito: { tipo: 'dano_extra', valor: '1d6', alvo: 'ataque_escolhido' },
  },
  {
    nome: 'Ataque Múltiplo',
    descricao: 'Você consegue atacar vários inimigos de uma vez em combate corpo a corpo, dividindo sua Força entre os alvos.',
    custo: 2,
    nivel: 2,
    tipo: ['ofensiva'],
    usar: 1,
    efeito: { tipo: 'ataque_multiplo', alcance: 'corpo_a_corpo', divide: 'forca' },
  },
  {
    nome: 'Tiro Múltiplo',
    descricao: 'Você dispara projéteis contra múltiplos inimigos à distância, dividindo seu Poder de Fogo entre os alvos.',
    custo: 2,
    nivel: 2,
    tipo: ['ofensiva'],
    usar: 1,
    efeito: { tipo: 'ataque_multiplo', alcance: 'distancia', divide: 'poder_de_fogo' },
  },
  {
    nome: 'Aceleração',
    descricao: 'Você é extraordinariamente rápido, capaz de realizar uma ação de movimento extra por turno.',
    custo: 1,
    nivel: 2,
    tipo: ['movimento'],
    usar: 1,
    efeito: { tipo: 'acao_extra', categoria: 'movimento' },
  },

  // Magic
  {
    nome: 'Magia Branca',
    descricao: 'Você domina magias de cura e proteção. Pode conjurar feitiços que restauram pontos de vida e criam barreiras.',
    custo: 2,
    nivel: 1,
    tipo: ['magico'],
    usar: 1,
    efeito: { tipo: 'magia', escola: 'branca', efeitos: ['cura', 'protecao', 'purificacao'] },
  },
  {
    nome: 'Magia Negra',
    descricao: 'Você domina magias destrutivas e de controle. Pode lançar feitiços que causam dano direto e condições negativas.',
    custo: 2,
    nivel: 1,
    tipo: ['magico'],
    usar: 1,
    efeito: { tipo: 'magia', escola: 'negra', efeitos: ['dano', 'controle', 'debuff'] },
  },
  {
    nome: 'Magia Elemental',
    descricao: 'Você controla os elementos da natureza. Pode conjurar feitiços de fogo, gelo e raio com efeitos variados.',
    custo: 2,
    nivel: 1,
    tipo: ['magico'],
    usar: 1,
    efeito: { tipo: 'magia', escola: 'elemental', elementos: ['fogo', 'gelo', 'raio'] },
  },

  // Passive
  {
    nome: 'Arena',
    descricao: 'Você possui vantagem em um ambiente específico. Recebe +2 em todos os testes realizados nesse terreno.',
    custo: 1,
    nivel: 1,
    tipo: ['passiva'],
    usar: 0,
    efeito: { tipo: 'bonus_teste', valor: 2, condicao: 'ambiente_especifico' },
  },
  {
    nome: 'Gênio',
    descricao: 'Você é excepcionalmente inteligente e culto. Recebe +2 em todos os testes de conhecimento e raciocínio.',
    custo: 1,
    nivel: 1,
    tipo: ['passiva'],
    usar: 0,
    efeito: { tipo: 'bonus_teste', valor: 2, categoria: 'conhecimento' },
  },
  {
    nome: 'Sentidos Especiais',
    descricao: 'Seus sentidos vão além do normal. Você pode perceber coisas invisíveis, ouvir sons distantes ou farejar perigo.',
    custo: 1,
    nivel: 1,
    tipo: ['passiva'],
    usar: 0,
    efeito: { tipo: 'sentido_aprimorado', opcoes: ['visao_noturna', 'audicao_aguada', 'faro'] },
  },
  {
    nome: 'Aparência Inofensiva',
    descricao: 'Você parece completamente inofensivo. Inimigos tendem a ignorá-lo em combate, escolhendo outros alvos primeiro.',
    custo: 1,
    nivel: 1,
    tipo: ['passiva'],
    usar: 0,
    efeito: { tipo: 'social', efeito: 'inimigos_subestimam', prioridade_alvo: -1 },
  },
  {
    nome: 'Boa Fama',
    descricao: 'Você é conhecido e respeitado. Recebe bônus em interações sociais e é mais facilmente aceito por NPCs.',
    custo: 1,
    nivel: 1,
    tipo: ['passiva'],
    usar: 0,
    efeito: { tipo: 'social', efeito: 'bonus_social', valor: 2 },
  },
  {
    nome: 'Sortudo',
    descricao: 'A sorte está ao seu lado. Uma vez por sessão, você pode rolar novamente um teste que tenha falhado.',
    custo: 1,
    nivel: 1,
    tipo: ['passiva'],
    usar: 1,
    efeito: { tipo: 'reroll', usos_por_sessao: 1, condicao: 'teste_falhado' },
  },

  // Physical
  {
    nome: 'Membros Elásticos',
    descricao: 'Seus membros podem se esticar além do normal, permitindo ataques corpo a corpo à distância.',
    custo: 1,
    nivel: 1,
    tipo: ['ofensiva'],
    usar: 0,
    efeito: { tipo: 'alcance_estendido', alcance: 'corpo_a_corpo_distante' },
  },
  {
    nome: 'Voo',
    descricao: 'Você pode voar livremente, ignorando terreno difícil e ganhando vantagem tática em combate.',
    custo: 2,
    nivel: 1,
    tipo: ['movimento'],
    usar: 0,
    efeito: { tipo: 'movimento', modo: 'voo', ignora_terreno: true },
  },
  {
    nome: 'Adaptador',
    descricao: 'Seu corpo se adapta automaticamente a ambientes hostis. Você sobrevive debaixo d\'água, no vácuo ou em calor extremo.',
    custo: 1,
    nivel: 1,
    tipo: ['passiva'],
    usar: 0,
    efeito: { tipo: 'adaptacao_ambiental', ambientes: ['aquatico', 'vacuo', 'extremo'] },
  },
  {
    nome: 'Invisibilidade',
    descricao: 'Você pode se tornar invisível, ficando indetectável pela visão. O efeito se encerra ao atacar.',
    custo: 2,
    nivel: 2,
    tipo: ['magico'],
    usar: 1,
    efeito: { tipo: 'invisibilidade', quebra_ao_atacar: true },
  },
  {
    nome: 'Teleporte',
    descricao: 'Você pode se teletransportar para qualquer ponto que consiga ver, dentro de um alcance curto.',
    custo: 2,
    nivel: 2,
    tipo: ['movimento'],
    usar: 1,
    efeito: { tipo: 'teleporte', alcance: 'curto', requer_visao: true },
  },
  {
    nome: 'Clones',
    descricao: 'Você cria cópias de si mesmo para confundir e atacar inimigos. Os clones agem de forma independente.',
    custo: 2,
    nivel: 3,
    tipo: ['ofensiva'],
    usar: 1,
    efeito: { tipo: 'clones', quantidade: 2, independente: true },
  },
  {
    nome: 'Imortal',
    descricao: 'Você não pode morrer permanentemente. Ao ser derrotado, ressuscita após algum tempo com 1 PV.',
    custo: 2,
    nivel: 3,
    tipo: ['defensiva'],
    usar: 0,
    efeito: { tipo: 'ressurreicao', hp_ao_reviver: 1, cooldown: 'longo' },
  },

  // Defense
  {
    nome: 'Armadura Extra',
    descricao: 'Você possui proteção adicional, seja por armadura, couro grosso ou campo de força. Recebe +1 de Armadura efetiva para defesa.',
    custo: 1,
    nivel: 1,
    tipo: ['defensiva'],
    usar: 0,
    efeito: { tipo: 'bonus_armadura', valor: 1 },
  },
  {
    nome: 'Resistência a Magia',
    descricao: 'Você é naturalmente resistente a efeitos mágicos. Todo dano mágico que recebe é reduzido pela metade.',
    custo: 1,
    nivel: 2,
    tipo: ['defensiva'],
    usar: 0,
    efeito: { tipo: 'resistencia', categoria: 'magia', reducao: 0.5 },
  },
  {
    nome: 'Deflexão',
    descricao: 'Você consegue desviar ou rebater projéteis e ataques à distância com reflexos extraordinários.',
    custo: 1,
    nivel: 2,
    tipo: ['defensiva'],
    usar: 1,
    efeito: { tipo: 'deflexao', contra: 'ataques_distancia' },
  },
  {
    nome: 'Regeneração',
    descricao: 'Seu corpo se regenera rapidamente. A cada rodada, você recupera 1 ponto de vida automaticamente.',
    custo: 3,
    nivel: 2,
    tipo: ['defensiva'],
    usar: 0,
    efeito: { tipo: 'regeneracao', valor: 1, frequencia: 'por_rodada' },
  },

  // --- New from Manual Alpha ---
  { nome: 'Aliado', descricao: 'Companheiro NPC leal. Pontuação 1 ponto abaixo da sua. Ajuda em combate e aventura.', custo: 1, nivel: 1, tipo: ['suporte'], usar: 0, efeito: { tipo: 'aliado', valor: 'nivel-1' } },
  { nome: 'Arcano', descricao: 'Domínio total de magias arcanas. Acesso a todas as escolas de magia conhecidas.', custo: 4, nivel: 3, tipo: ['magico'], usar: 0 },
  { nome: 'Área de Batalha', descricao: 'Seu ataque afeta todos os inimigos em uma área. Aliados também podem ser atingidos.', custo: 2, nivel: 2, tipo: ['ofensiva'], usar: 1 },
  { nome: 'Clericato', descricao: 'Acesso a magias divinas e 3 magias extras de seu Mentor divino.', custo: 1, nivel: 1, tipo: ['magico'], usar: 0 },
  { nome: 'Elementalista', descricao: 'Domínio de 1 elemento natural por ponto investido. Bônus em magias desse elemento.', custo: 1, nivel: 1, tipo: ['magico'], usar: 0 },
  { nome: 'Energia Extra', descricao: 'Gasta 2 PM para recuperar todos os PVs. Por 1pt: só Perto da Morte. Por 2pt: qualquer momento.', custo: 1, nivel: 1, tipo: ['defensiva'], usar: 1 },
  { nome: 'Energia Vital', descricao: 'Recupera PVs de aliados tocando-os. Transfere sua energia vital para curar outros.', custo: 2, nivel: 2, tipo: ['suporte'], usar: 1 },
  { nome: 'Familiar', descricao: 'Animal mágico companheiro com poderes menores e vínculo telepático.', custo: 1, nivel: 1, tipo: ['suporte', 'magico'], usar: 0 },
  { nome: 'Forma Alternativa', descricao: 'Pode assumir outra forma com características diferentes. A mudança leva 1 turno.', custo: 2, nivel: 2, tipo: ['transformacao'], usar: 1 },
  { nome: 'Inimigo', descricao: 'Rival recorrente que atrapalha seus planos. Quanto mais forte, mais pontos dá ao Mestre.', custo: 1, nivel: 1, tipo: ['narrativa'], usar: 0 },
  { nome: 'Ligação Natural', descricao: 'Comunicação instintiva com animais e plantas. Entende a natureza ao redor.', custo: 1, nivel: 1, tipo: ['passiva'], usar: 0 },
  { nome: 'Membros Extras', descricao: 'Braços, tentáculos ou apêndices adicionais. Permite 1 ataque extra por turno.', custo: 2, nivel: 2, tipo: ['ofensiva'], usar: 0 },
  { nome: 'Mente Expandida', descricao: 'Telepatia avançada com controle mental menor. Pode influenciar pensamentos.', custo: 2, nivel: 2, tipo: ['magico'], usar: 1 },
  { nome: 'Mentor', descricao: 'Mestre sábio que ensinou seus poderes. Em momentos difíceis, lembra de ensinamentos valiosos.', custo: 1, nivel: 1, tipo: ['suporte'], usar: 0 },
  { nome: 'Paladino', descricao: 'Detectar presença do mal e proteção contra medo para si e aliados próximos.', custo: 1, nivel: 1, tipo: ['suporte'], usar: 1 },
  { nome: 'Paralisia', descricao: 'Paralisar um alvo por 1 turno com toque ou olhar. Alvo faz teste de R para resistir.', custo: 1, nivel: 1, tipo: ['controle'], usar: 1 },
  { nome: 'Parceiro', descricao: 'Aliado que luta em sincronia. Quando juntos, combinam as características mais altas.', custo: 1, nivel: 1, tipo: ['suporte'], usar: 0 },
  { nome: 'Patrono', descricao: 'Organização ou NPC poderoso fornece recursos, transporte e reforços quando necessário.', custo: 1, nivel: 1, tipo: ['social'], usar: 0 },
  { nome: 'Poder Oculto', descricao: 'Poder secreto devastador que se manifesta em momentos críticos. +1d por ponto investido.', custo: 1, nivel: 1, tipo: ['ofensiva'], usar: 1 },
  { nome: 'PMs Extras', descricao: '+5 Pontos de Magia por ponto investido nesta vantagem.', custo: 1, nivel: 1, tipo: ['magico'], usar: 0 },
  { nome: 'PVs Extras', descricao: '+5 Pontos de Vida por ponto investido nesta vantagem.', custo: 1, nivel: 1, tipo: ['defensiva'], usar: 0 },
  { nome: 'Reflexão', descricao: 'Rebater ataques à distância de volta ao atacante. Teste de H para refletir.', custo: 2, nivel: 2, tipo: ['defensiva'], usar: 1 },
  { nome: 'Possessão', descricao: 'Controlar o corpo de outro ser temporariamente. Alvo faz teste de R para resistir.', custo: 2, nivel: 2, tipo: ['magico', 'controle'], usar: 1 },
  { nome: 'Riqueza', descricao: 'Recursos financeiros ilimitados. Pode comprar equipamento normal e contratar serviços.', custo: 2, nivel: 1, tipo: ['social'], usar: 0 },
  { nome: 'Separação', descricao: 'Dividir-se em 2 ou mais seres menores, cada um com características reduzidas.', custo: 2, nivel: 2, tipo: ['transformacao'], usar: 1 },
  { nome: 'Tiro Carregável', descricao: 'Concentrar 1 turno para PdF dobrado no próximo ataque. Gasta 2 PM.', custo: 1, nivel: 1, tipo: ['ofensiva'], usar: 1 },
  { nome: 'Torcida', descricao: '+1 em combate quando aliados ou público torcem por você.', custo: 1, nivel: 1, tipo: ['suporte'], usar: 0 },
  { nome: 'Transferência de Energia', descricao: 'Transferir seus PVs ou PMs para aliados ao toque.', custo: 1, nivel: 1, tipo: ['suporte'], usar: 1 },
  { nome: 'Xamã', descricao: 'Comunicação com espíritos e magias espirituais. Pode pedir conselhos aos mortos.', custo: 1, nivel: 1, tipo: ['magico'], usar: 1 },
];

async function main() {
  console.log(`Inserindo ${vantagens.length} vantagens 3D&T...`);

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
      console.error(`Erro em "${v.nome}":`, err.message);
      erros++;
    }
  }

  console.log(`Vantagens 3D&T: ${inseridas} inseridas/atualizadas, ${erros} com erro.`);

  const total = await prisma.vantagens.count({ where: { sistema: 'tresdet' } });
  console.log(`Total vantagens 3D&T no banco: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
