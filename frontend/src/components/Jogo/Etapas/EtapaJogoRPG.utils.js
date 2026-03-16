import { calcularMana } from '../../../utils/rpgHelpers';

export const extrairFacesDoDado = (tipoDado) => {
  if (!tipoDado || typeof tipoDado !== 'string') return 20;
  const match = tipoDado.match(/d(\d+)/);
  return match ? parseInt(match[1]) : 20;
};

export const rolarDados = (tipoDado = 'd20', descricao = '') => {
  const faces = extrairFacesDoDado(tipoDado);
  const resultado = Math.floor(Math.random() * faces) + 1;
  const conteudo = descricao
    ? `🎲 ${descricao}: ${resultado} (${tipoDado})`
    : `🎲 Voce rolou: ${resultado} (${tipoDado})`;
  return {
    resultado,
    tipoDado,
    descricao,
    mensagem: {
      id: Date.now() + Math.random(),
      autor: 'Sistema',
      conteudo,
      tipo: 'dado',
      timestamp: new Date()
    }
  };
};

export const formatarInformacoesPersonagem = (personagem) => {
  if (!personagem) {
    return { nome: 'Personagem nao encontrado', classe: 'Desconhecida', raca: 'Desconhecida', nivel: '1', hp: '???', mp: '???', xp: '0' };
  }
  const manaMax = calcularMana(personagem);
  return {
    nome: personagem.nome || 'Personagem sem nome',
    classe: personagem.classe_nome || personagem.classe || 'Desconhecida',
    raca: personagem.raca_nome || personagem.raca || 'Desconhecida',
    nivel: personagem.nivel || '1',
    hp: personagem.hp_atual || personagem.hp || '???',
    hp_max: personagem.hp_max || personagem.hp || null,
    mp: manaMax,
    xp: personagem.xp || '0',
    xp_atual: personagem.xp_atual || personagem.xp || 0,
    xp_proximo_nivel: personagem.xp_proximo_nivel || null,
    imagem: personagem.imagem || null,
    equipamentos: personagem.equipamentos || [],
    vantagens: personagem.vantagens || [],
    desvantagens: personagem.desvantagens || [],
  };
};

export const formatarParticipantes = (participantes, user) => {
  if (!Array.isArray(participantes)) return [];
  return participantes
    .filter(p => p.userId !== user?.id)
    .map(participante => ({
      ...participante,
      username: participante.username || 'Jogador',
      personagem: participante.personagem || 'Personagem',
      isOwner: participante.isOwner || false,
      status: participante.status || 'online',
    }));
};
