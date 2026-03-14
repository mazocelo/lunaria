import db from '../Model/index.js';
import gerenciadorSessoes from '../redis/sessoes.js';
import blueprintService from './blueprintService.js';
import { buildCatalogoCompleto } from '../agents/Mestre/catalogo/catalogoMestre.js';
import { buildMestreContext } from '../agents/Mestre/contexto/mestreContextBuilder.js';
import { MODE_TEMPERATURES } from '../config/blueprintModes.js';

export async function gerarTemasNomes(temas = []) {
  const temasDB = await db.Temas.findAll();
  return (temas || []).map((tid) => {
    const tema = temasDB.find((item) => item.id === tid);
    return tema?.nome || `Tema ${tid}`;
  });
}

export async function sincronizarRoteiroNaSessao(historia, roteiro, roteiroStatus = 'completed') {
  const salaId = `historia_${historia.id}`;

  try {
    await gerenciadorSessoes.initialize();
    const sessao = await gerenciadorSessoes.obterSessao(salaId);
    if (!sessao) return;

    const historiaComRoteiro = { ...historia, roteiro, roteiro_status: roteiroStatus };
    const estadoJogo = {
      ...(sessao.estadoJogo || {}),
      historiaRoteiroAtualizadoEm: new Date().toISOString()
    };

    const sessaoAtualizada = {
      ...sessao,
      historiaRoteiro: roteiro,
      estadoJogo
    };

    const mestreContexto = buildMestreContext(sessaoAtualizada, historiaComRoteiro);

    await gerenciadorSessoes.atualizarSessao(salaId, {
      historiaRoteiro: roteiro,
      mestreContexto,
      estadoJogo: {
        ...estadoJogo,
        mestreContexto
      }
    });
  } catch (error) {
    console.warn(`Erro ao sincronizar roteiro na sessao ${salaId}:`, error.message);
  }
}

export async function processarGeracaoRoteiro(historia, userId, options = {}) {
  const historiaId = parseInt(historia.id, 10);
  const {
    mode = historia?.roteiro ? 'regenerate' : 'initial',
    markErrorStatus = true,
    onSuccess = null,
    onError = null
  } = options;

  try {
    const catalogo = await buildCatalogoCompleto();
    const temasNomes = await gerarTemasNomes(historia.temas || []);
    const resultado = await blueprintService.gerarRoteiro(historia, catalogo, temasNomes, userId, {
      mode,
      previousBlueprint: historia?.roteiro || null
    });
    const { roteiro, prompt: requestPrompt, responseText } = resultado;

    await db.Historia.updateHistoria(historiaId, {
      roteiro,
      roteiro_status: 'completed'
    });

    const historiaAtualizada = {
      ...historia,
      roteiro,
      roteiro_status: 'completed'
    };

    await sincronizarRoteiroNaSessao(historiaAtualizada, roteiro, 'completed');

    // Salvar versão no histórico
    try {
      await db.prisma.roteiro_versoes.updateMany({
        where: { historia_id: historiaId, ativa: true },
        data: { ativa: false }
      });

      const lastVersion = await db.prisma.roteiro_versoes.findFirst({
        where: { historia_id: historiaId },
        orderBy: { versao: 'desc' }
      });

      await db.prisma.roteiro_versoes.create({
        data: {
          historia_id: historiaId,
          versao: (lastVersion?.versao || 0) + 1,
          modo: mode,
          temperatura: MODE_TEMPERATURES[mode] || 0.3,
          modelo: 'claude-sonnet-4-5-20250929',
          roteiro,
          ativa: true,
          metadados: { userId, geradoEm: new Date().toISOString() }
        }
      });
    } catch (versionError) {
      console.warn(`Erro ao salvar versão do roteiro para historia ${historiaId}:`, versionError.message);
    }

    // Persistir prompt/response no ai_job (se aiJobId fornecido)
    if (options.aiJobId && requestPrompt) {
      try {
        await db.prisma.ai_jobs.update({
          where: { id: options.aiJobId },
          data: {
            request_prompt: requestPrompt,
            response_text: responseText || null
          }
        });
      } catch (_) {
        // melhor esforço
      }
    }

    if (typeof onSuccess === 'function') {
      await onSuccess({
        historiaId,
        historia: historiaAtualizada,
        roteiro
      });
    }

    return roteiro;
  } catch (error) {
    if (markErrorStatus) {
      await db.Historia.updateHistoria(historiaId, { roteiro_status: 'error' });
    }

    if (typeof onError === 'function') {
      await onError({ historiaId, error });
    }

    throw error;
  }
}

export default {
  gerarTemasNomes,
  sincronizarRoteiroNaSessao,
  processarGeracaoRoteiro
};
