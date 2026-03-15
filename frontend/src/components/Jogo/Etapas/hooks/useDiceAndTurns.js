import { useCallback } from 'react';
import { showGameNotification } from '../../NotificationManager';
import { useSocketStore } from '../../../../store/index.js';
import { rolarDados } from '../EtapaJogoRPG.utils.js';

export const useDiceAndTurns = (historia, personagemSelecionado, user, onAdicionarMensagem) => {
  const socketStoreSafeEmit = useSocketStore(s => s.safeEmit);
  const socketStoreRolarDadoInicial = useSocketStore(s => s.rolarDadoInicial);
  const socketStoreIniciarTurno = useSocketStore(s => s.iniciarTurno);
  const buildPersonagemPayload = useCallback(() => ({
    id: personagemSelecionado?.id ?? personagemSelecionado?.personagemId ?? personagemSelecionado?.personagem_id ?? null,
    personagemId: personagemSelecionado?.personagemId ?? personagemSelecionado?.personagem_id ?? personagemSelecionado?.id ?? null,
    nome: personagemSelecionado?.nome || 'Aventureiro',
    classe: personagemSelecionado?.classe_nome || '',
    nivel: personagemSelecionado?.nivel || 1
  }), [personagemSelecionado]);

  const handleRolarDados = useCallback(async (tipoDado = 'd20', descricao = '', dadoSolicitadoInfo = null) => {
    try {
      const dadoFinal = dadoSolicitadoInfo?.tipoDado || tipoDado;
      const descricaoFinal = descricao || dadoSolicitadoInfo?.teste || '';

      const roomId = `historia_${historia?.id}`;
      const resultado = rolarDados(dadoFinal, descricaoFinal);

      const enviado = socketStoreSafeEmit('dice_roll', {
        roomId,
        userId: String(user?.id),
        username: user?.nome || user?.name,
        dice: String(dadoFinal),
        result: String(resultado.resultado),
        description: descricaoFinal
      });

      if (!enviado) {
        onAdicionarMensagem(resultado.mensagem);
      }
    } catch (error) {
      const resultado = rolarDados(tipoDado, descricao);
      onAdicionarMensagem(resultado.mensagem);
    }
  }, [historia?.id, user, socketStoreSafeEmit, onAdicionarMensagem]);

  const handleRolarDadoInicial = useCallback(async () => {
    try {
      if (socketStoreRolarDadoInicial) {
        socketStoreRolarDadoInicial();
      }
    } catch (error) {
      // silenced
    }
  }, [socketStoreRolarDadoInicial]);

  const handleIniciarTurno = useCallback(async () => {
    try {
      if (socketStoreIniciarTurno) {
        socketStoreIniciarTurno();
      }
    } catch (error) {
      // silenced
    }
  }, [socketStoreIniciarTurno]);

  const handleExecutarAcao = useCallback((acao, target = null, description = null) => {
    const textoAcao = description || acao;
    const mensagemAcao = {
      id: Date.now() + Math.random(),
      autor: 'Voce',
      conteudo: `⚔️ ${textoAcao}`,
      tipo: 'acao',
      timestamp: new Date()
    };
    onAdicionarMensagem(mensagemAcao);
  }, [onAdicionarMensagem]);

  const handleUsarHabilidade = useCallback(async (vantagem) => {
    try {
      const roomId = `historia_${historia?.id}`;
      const descricao = `[USA HABILIDADE: ${vantagem.nome}]${vantagem.dano_base ? ` Dano base: ${vantagem.dano_base}` : ''}${vantagem.elemento?.length ? ` Elemento: ${vantagem.elemento.join(', ')}` : ''} - ${vantagem.descricao || ''}`;

      onAdicionarMensagem({
        id: `loading_${Date.now()}`,
        userId: 'sistema',
        username: 'Sistema',
        message: '⏳ O Mestre esta pensando...',
        tipo: 'loading',
        timestamp: Date.now()
      });

      socketStoreSafeEmit('mensagem_para_mestre', {
        roomId,
        userId: String(user?.id),
        username: user?.nome || user?.name,
        mensagem: descricao,
        combatIntent: { tipo: 'usar_habilidade', habilidadeId: vantagem.id, habilidadeNome: vantagem.nome },
        personagem: buildPersonagemPayload()
      });
    } catch (error) {
      // silenced
    }
  }, [historia?.id, user, socketStoreSafeEmit, onAdicionarMensagem, buildPersonagemPayload]);

  const handleUsarEquipamento = useCallback(async (equipamento) => {
    try {
      const roomId = `historia_${historia?.id}`;
      const descricao = `[USA EQUIPAMENTO: ${equipamento.nome}]${equipamento.dano_base ? ` Dano: ${equipamento.dano_base}` : ''}${equipamento.elemento?.length ? ` Elemento: ${equipamento.elemento.join(', ')}` : ''} - ${equipamento.descricao || ''}`;

      onAdicionarMensagem({
        id: `loading_${Date.now()}`,
        userId: 'sistema',
        username: 'Sistema',
        message: '⏳ O Mestre esta pensando...',
        tipo: 'loading',
        timestamp: Date.now()
      });

      socketStoreSafeEmit('mensagem_para_mestre', {
        roomId,
        userId: String(user?.id),
        username: user?.nome || user?.name,
        mensagem: descricao,
        personagem: buildPersonagemPayload()
      });
    } catch (error) {
      // silenced
    }
  }, [historia?.id, user, socketStoreSafeEmit, onAdicionarMensagem, buildPersonagemPayload]);

  return {
    handleRolarDados,
    handleRolarDadoInicial,
    handleIniciarTurno,
    handleExecutarAcao,
    handleUsarHabilidade,
    handleUsarEquipamento,
  };
};
