/**
 * Controller do Mestre Criador — endpoint de interação do wizard
 */
import { interagir } from '../../agents/MestreCriador/MestreCriadorAgent.js';
import { ETAPAS } from '../../agents/MestreCriador/config.js';
import { getStagePolicy } from '../../agents/MestreCriador/stages/stagePolicy.js';
import { sanitizePromptInput } from '../../helpers/sanitize.js';

class MestreCriadorController {
  /**
   * POST /api/mestre-criador/interagir
   * Body: { etapa, estado, mensagemJogador, historico, sistema }
   */
  async interagir(req, res) {
    const { etapa, estado, mensagemJogador, historico, actionMode, sistema } = req.body;
    const userId = req.user?.id;
    const sistemaEfetivo = sistema || estado?.sistema || 'lunaria';
    const { stageOrder } = getStagePolicy(sistemaEfetivo);

    // Validação básica
    if (!etapa || !stageOrder.includes(etapa)) {
      return res.status(400).json({
        success: false,
        error: `Etapa inválida para sistema ${sistemaEfetivo}. Etapas válidas: ${stageOrder.join(', ')}`,
      });
    }

    if (mensagemJogador == null || typeof mensagemJogador !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'mensagemJogador é obrigatória',
      });
    }

    const resultado = await interagir({
      etapa,
      estado: estado || {},
      mensagemJogador: sanitizePromptInput(mensagemJogador, 2000),
      historico: Array.isArray(historico) ? historico : [],
      userId,
      actionMode: actionMode || 'reply',
      sistema: sistemaEfetivo,
    });

    return res.json({
      success: true,
      data: resultado,
    });
  }
}

export default new MestreCriadorController();
