import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function objectSize(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;
  return Object.keys(value).length;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function mensagemTexto(msg) {
  return getString(msg?.mensagem || msg?.texto || msg?.content || msg?.conteudo);
}

function analisarMestre(mestre) {
  const historias = asArray(mestre.historias);
  const sessoes = historias.flatMap((h) =>
    asArray(h.sessoes_jogo).map((s) => ({
      ...s,
      historia_nome: h.nome,
      historia_publica: h.publica,
    }))
  );

  let totalMensagens = 0;
  let mensagensMestre = 0;
  let mensagensJogador = 0;
  let charsMestre = 0;
  let sessoesComTroca = 0;
  let sessoesComMestre = 0;
  let sessoesComJogador = 0;
  let jogadoresTotal = 0;

  for (const sessao of sessoes) {
    const mensagens = asArray(sessao.mensagens);
    totalMensagens += mensagens.length;
    const jogadoresNaSessao = Array.isArray(sessao.jogadores)
      ? sessao.jogadores.length
      : objectSize(sessao.jogadores);
    jogadoresTotal += jogadoresNaSessao;

    let temMestre = false;
    let temJogador = false;

    for (const msg of mensagens) {
      const tipo = getString(msg?.tipo).toLowerCase();
      if (tipo === 'mestre') {
        temMestre = true;
        mensagensMestre += 1;
        charsMestre += mensagemTexto(msg).length;
      } else if (tipo === 'jogador') {
        temJogador = true;
        mensagensJogador += 1;
      }
    }

    if (temMestre) sessoesComMestre += 1;
    if (temJogador) sessoesComJogador += 1;
    if (temMestre && temJogador) sessoesComTroca += 1;
  }

  const personalidade = getString(mestre.personalidade);
  const tomNarrativo = getString(mestre.tom_narrativo);
  const regras = getString(mestre.regras_especiais);
  const descricao = getString(mestre.descricao);
  const nome = getString(mestre.nome);

  let scoreConfig = 0;
  if (nome.length >= 3) scoreConfig += 10;
  if (descricao.length >= 80) scoreConfig += 10;
  if (personalidade.length >= 220) scoreConfig += 25;
  else if (personalidade.length >= 120) scoreConfig += 15;
  else if (personalidade.length >= 40) scoreConfig += 8;

  if (tomNarrativo.length >= 30) scoreConfig += 15;
  else if (tomNarrativo.length >= 12) scoreConfig += 8;

  if (regras.length >= 250) scoreConfig += 20;
  else if (regras.length >= 120) scoreConfig += 12;
  else if (regras.length >= 40) scoreConfig += 6;

  const temp = Number(mestre.temperatura ?? 0.9);
  if (temp >= 0.75 && temp <= 1.05) scoreConfig += 10;
  else if (temp >= 0.55 && temp <= 1.2) scoreConfig += 6;

  const maxTokens = Number(mestre.max_tokens ?? 8000);
  if (maxTokens >= 4000 && maxTokens <= 16000) scoreConfig += 10;
  else if (maxTokens > 16000 && maxTokens <= 40000) scoreConfig += 6;

  scoreConfig = clamp(scoreConfig, 0, 100);

  let scoreExecucao = 0;
  if (historias.length >= 1) scoreExecucao += 10;
  if (sessoes.length >= 3) scoreExecucao += 20;
  else if (sessoes.length >= 1) scoreExecucao += 10;

  const mediaMsgsSessao = sessoes.length ? totalMensagens / sessoes.length : 0;
  if (mediaMsgsSessao >= 12) scoreExecucao += 20;
  else if (mediaMsgsSessao >= 6) scoreExecucao += 12;
  else if (mediaMsgsSessao >= 3) scoreExecucao += 8;

  const mediaCharsMestre = mensagensMestre ? charsMestre / mensagensMestre : 0;
  if (mediaCharsMestre >= 450 && mediaCharsMestre <= 1900) scoreExecucao += 20;
  else if (mediaCharsMestre >= 280) scoreExecucao += 12;
  else if (mediaCharsMestre > 0) scoreExecucao += 6;

  const taxaTroca = sessoes.length ? sessoesComTroca / sessoes.length : 0;
  if (taxaTroca >= 0.7) scoreExecucao += 20;
  else if (taxaTroca >= 0.4) scoreExecucao += 12;
  else if (taxaTroca > 0) scoreExecucao += 6;

  const mediaJogadoresSessao = sessoes.length ? jogadoresTotal / sessoes.length : 0;
  if (mediaJogadoresSessao >= 2) scoreExecucao += 20;
  else if (mediaJogadoresSessao >= 1) scoreExecucao += 12;

  scoreExecucao = clamp(scoreExecucao, 0, 100);

  const scoreFinal = Math.round(scoreConfig * 0.55 + scoreExecucao * 0.45);

  const diagnostico =
    scoreFinal >= 80
      ? 'alto potencial de narracao divertida'
      : scoreFinal >= 60
        ? 'bom potencial, com ajustes recomendados'
        : scoreFinal >= 40
          ? 'potencial medio; risco de experiencia irregular'
          : 'potencial baixo; precisa ajustes estruturais';

  return {
    mestre_id: mestre.id,
    nome: mestre.nome,
    tags: asArray(mestre.tags),
    dono: mestre.usuarios?.nome || null,
    modelo: mestre.modelo,
    temperatura: mestre.temperatura,
    max_tokens: mestre.max_tokens,
    voz: {
      voice_id: mestre.voice_id || null,
      voice_provider: mestre.voice_provider || null,
    },
    texto: {
      descricao_chars: descricao.length,
      personalidade_chars: personalidade.length,
      tom_narrativo_chars: tomNarrativo.length,
      regras_especiais_chars: regras.length,
    },
    uso: {
      historias_total: historias.length,
      historias_publicas: historias.filter((h) => h.publica).length,
      sessoes_total: sessoes.length,
      sessoes_com_mestre: sessoesComMestre,
      sessoes_com_jogador: sessoesComJogador,
      sessoes_com_troca: sessoesComTroca,
      mensagens_total: totalMensagens,
      mensagens_mestre: mensagensMestre,
      mensagens_jogador: mensagensJogador,
      media_mensagens_por_sessao: Number(mediaMsgsSessao.toFixed(2)),
      media_chars_mensagem_mestre: Number(mediaCharsMestre.toFixed(2)),
      media_jogadores_por_sessao: Number(mediaJogadoresSessao.toFixed(2)),
    },
    score: {
      configuracao: scoreConfig,
      execucao: scoreExecucao,
      final: scoreFinal,
    },
    diagnostico,
  };
}

async function main() {
  const mestres = await prisma.mestres.findMany({
    where: { deleted_at: null },
    orderBy: { id: 'asc' },
    include: {
      usuarios: { select: { id: true, nome: true } },
      historias: {
        where: { deleted_at: null },
        select: {
          id: true,
          nome: true,
          publica: true,
          sessoes_jogo: {
            select: {
              id: true,
              mensagens: true,
              jogadores: true,
            },
          },
        },
      },
    },
  });

  const analise = mestres.map(analisarMestre);

  const resposta = {
    gerado_em: new Date().toISOString(),
    total_mestres_ativos: analise.length,
    mestres: analise,
  };

  console.log(JSON.stringify(resposta, null, 2));
}

main()
  .catch((err) => {
    console.error('[audit-mestres] erro:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
