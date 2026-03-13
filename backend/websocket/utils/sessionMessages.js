import crypto from 'crypto';

const MAX_MENSAGENS_SESSAO = 500;

function nowTimestamp(value = null) {
  if (value != null) return value;
  return Date.now();
}

export function createMessageId(prefix = 'msg') {
  if (typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createSessionMessage({
  id = null,
  tipo,
  canal = 'formal',
  origem = 'sistema',
  userId = null,
  username = 'Sistema',
  message = '',
  payload = null,
  timestamp = null,
  ...rest
} = {}) {
  const safeMessage = String(message || '');
  return {
    id: id || createMessageId(tipo || 'msg'),
    tipo: tipo || 'sistema',
    canal,
    origem,
    userId,
    username,
    message: safeMessage,
    mensagem: safeMessage,
    payload,
    timestamp: nowTimestamp(timestamp),
    ...rest
  };
}

export function appendMensagemSessao(sessao = {}, mensagem) {
  sessao.mensagens = Array.isArray(sessao.mensagens) ? sessao.mensagens : [];
  sessao.mensagens.push(mensagem);
  if (sessao.mensagens.length > MAX_MENSAGENS_SESSAO) {
    sessao.mensagens.splice(0, sessao.mensagens.length - MAX_MENSAGENS_SESSAO);
  }
  return mensagem;
}

export function buildMestreMensagem(conteudo, mestreConfig = null, options = {}) {
  const voiceId = mestreConfig?.voice_id || null;
  const voiceProvider = mestreConfig?.voice_provider || null;
  return createSessionMessage({
    tipo: options.tipo || 'mestre',
    canal: options.canal || 'formal',
    origem: options.origem || 'turno',
    userId: options.userId || 'mestre',
    username: options.username || 'Mestre',
    message: conteudo,
    payload: options.payload || null,
    voice_id: voiceId,
    voice_provider: voiceProvider,
    audio_cache_key: options.audioCacheKey || null,
    ...options.extraFields
  });
}

export function buildJogadorMensagem({
  userId,
  username,
  personagem = null,
  message,
  origem = 'turno',
  payload = null
} = {}) {
  return createSessionMessage({
    tipo: 'jogador',
    canal: 'formal',
    origem,
    userId,
    username: username || 'Jogador',
    message,
    payload,
    personagem
  });
}

export function buildRoleplayMensagem({
  userId,
  username,
  message,
  payload = null
} = {}) {
  return createSessionMessage({
    tipo: 'roleplay',
    canal: 'roleplay',
    origem: 'turno',
    userId,
    username: username || 'Jogador',
    message,
    payload
  });
}

export function buildSolicitacaoDadosMensagem({
  narrativa,
  origem = 'manual',
  payload = null
} = {}) {
  return createSessionMessage({
    tipo: 'solicitacao_dados',
    canal: 'formal',
    origem,
    userId: 'mestre',
    username: 'Mestre',
    message: narrativa || 'O Mestre solicita uma rolagem de dados.',
    payload
  });
}

export function buildResultadoTesteMensagem({
  userId,
  username,
  personagemNome,
  dice,
  resultado,
  rolagemBruta,
  total,
  totalModificador,
  atributoNome,
  dc,
  sucesso,
  descricaoResultado,
  payload = null
} = {}) {
  const bruto = rolagemBruta ?? resultado ?? '?';
  const totalTexto = total != null ? ` = ${total}` : '';
  const dcTexto = dc != null ? ` vs DC ${dc}` : '';
  const desfecho = descricaoResultado ? ` -> ${descricaoResultado}` : '';
  const atributoTexto = atributoNome ? ` (${atributoNome}${totalModificador ? ` ${totalModificador >= 0 ? '+' : ''}${totalModificador}` : ''})` : '';
  return createSessionMessage({
    tipo: 'resultado_teste',
    canal: 'formal',
    origem: 'turno',
    userId,
    username: username || personagemNome || 'Jogador',
    message: `${personagemNome || username || 'Jogador'} rolou ${dice || 'd20'}: ${bruto}${atributoTexto}${totalTexto}${dcTexto}${desfecho}`,
    payload: payload || {
      personagemNome,
      dice,
      resultado,
      rolagemBruta,
      total,
      totalModificador,
      atributoNome,
      dc,
      sucesso,
      descricaoResultado
    },
    personagemNome,
    dice,
    result: resultado ?? rolagemBruta ?? null,
    rolagemBruta,
    total,
    totalModificador,
    atributoNome,
    dc,
    sucesso,
    descricaoResultado
  });
}

function buildAcaoMestreTexto(acao = {}) {
  switch (acao.tipo) {
    case 'item_recebido':
      return `${acao.personagem || 'Personagem'} recebeu ${acao.item?.nome || acao.itemNome || 'um item'}.`;
    case 'item_removido':
      return `${acao.personagem || 'Personagem'} perdeu ${acao.item?.nome || acao.itemNome || 'um item'}.`;
    case 'curado':
      return `${acao.personagem || 'Personagem'} recuperou ${acao.hp_restaurado || 0} HP.`;
    case 'dano_recebido':
      if (acao.imune) {
        return `${acao.personagem || 'Personagem'} ignorou o dano${acao.elemento ? ` de ${acao.elemento}` : ''}.`;
      }
      return `${acao.personagem || 'Personagem'} sofreu ${acao.dano || 0} de dano${acao.elemento ? ` (${acao.elemento})` : ''}.`;
    case 'status_aplicado':
      return `${acao.personagem || 'Personagem'} recebeu o status ${acao.status}.`;
    case 'status_removido':
      return `${acao.personagem || 'Personagem'} teve o status ${acao.status} removido.`;
    case 'habilidade_usada':
      return `${acao.personagem || 'Personagem'} usou ${acao.nome || 'uma habilidade'}.`;
    case 'habilidade_bloqueada':
      return `${acao.personagem || 'Personagem'} não conseguiu usar ${acao.nome || 'uma habilidade'}.`;
    case 'magia_conjurada':
      return `${acao.personagem || 'Personagem'} conjurou ${acao.nome || 'uma magia'}.`;
    case 'magia_bloqueada':
      return `${acao.personagem || 'Personagem'} não conseguiu conjurar ${acao.nome || 'uma magia'}.`;
    case 'desvantagem_ativada':
      return `${acao.personagem || 'Personagem'} foi afetado por ${acao.desvantagem || 'uma desvantagem'}.`;
    case 'desvantagem_teste_requerido':
      return `${acao.personagem || 'Personagem'} precisa resistir a ${acao.desvantagem || 'uma desvantagem'}.`;
    case 'vantagem_aplicada':
      return `${acao.personagem || 'Personagem'} recebeu a vantagem ${acao.vantagem || 'especial'}.`;
    case 'efeito_aplicado':
      return `${acao.personagem || 'Personagem'} foi afetado por ${acao.efeito || 'um efeito'}.`;
    case 'efeito_removido':
      return `${acao.personagem || 'Personagem'} perdeu o efeito ${acao.efeito || 'ativo'}.`;
    case 'xp_recebido':
      return `${acao.personagem || 'Personagem'} recebeu ${acao.xp || 0} XP.`;
    case 'concentracao_quebrada':
      return `${acao.personagem || 'Personagem'} perdeu a concentração em ${acao.magia || 'uma magia'}.`;
    case 'efeitos_expirados':
      return `${acao.personagem || 'Personagem'} teve efeitos expirados: ${(acao.efeitos || []).join(', ')}.`;
    default:
      return acao.message || acao.mensagem || `Evento mecânico: ${acao.tipo || 'acao_mestre'}.`;
  }
}

export function buildAcaoMestreMensagem(acao = {}) {
  return createSessionMessage({
    tipo: 'acao_mestre',
    canal: 'formal',
    origem: acao.origem || 'sistema',
    userId: acao.userId || 'sistema',
    username: acao.username || 'Sistema',
    message: buildAcaoMestreTexto(acao),
    payload: { ...acao }
  });
}

export function buildSistemaMensagem(message, options = {}) {
  return createSessionMessage({
    tipo: options.tipo || 'sistema',
    canal: options.canal || 'sistema',
    origem: options.origem || 'sistema',
    userId: options.userId || 'sistema',
    username: options.username || 'Sistema',
    message,
    payload: options.payload || null,
    ...options.extraFields
  });
}
