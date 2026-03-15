/**
 * Controller do Mestre Criador — endpoint de interação do wizard
 */
import { interagir } from '../../agents/MestreCriador/MestreCriadorAgent.js';
import { ETAPAS } from '../../agents/MestreCriador/config.js';

class MestreCriadorController {
  /**
   * POST /api/mestre-criador/interagir
   * Body: { etapa, estado, mensagemJogador, historico }
   */
  async interagir(req, res) {
    const { etapa, estado, mensagemJogador, historico, actionMode } = req.body;
    const userId = req.user?.id;

    // Validação básica
    if (!etapa || !ETAPAS.includes(etapa)) {
      return res.status(400).json({
        success: false,
        error: `Etapa inválida. Etapas válidas: ${ETAPAS.join(', ')}`,
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
      mensagemJogador: mensagemJogador.trim(),
      historico: Array.isArray(historico) ? historico : [],
      userId,
      actionMode: actionMode || 'reply',
    });

    return res.json({
      success: true,
      data: resultado,
    });
  }
}

export default new MestreCriadorController();
