import { calcularMana, calcularHPMaximo } from '../../../utils/rpgHelpers';

interface PersonagemBasico {
  nome?: string;
  classe?: string;
  classe_nome?: string;
  raca?: string;
  raca_nome?: string;
  nivel?: number | string;
  hp?: number | string;
  hp_atual?: number | string;
  hp_max?: number | string;
  hp_maximo?: number | string;
  xp?: number | string;
  xp_atual?: number;
  xp_proximo_nivel?: number | null;
  imagem?: string | null;
  equipamentos?: unknown[];
  vantagens?: unknown[];
  desvantagens?: unknown[];
  [key: string]: unknown;
}

interface UserBasico {
  id?: number | string;
}

interface ParticipanteBasico {
  userId?: number | string;
  username?: string;
  personagem?: string;
  isOwner?: boolean;
  status?: string;
  [key: string]: unknown;
}

export const extrairFacesDoDado = (tipoDado: string | undefined | null): number => {
  if (!tipoDado || typeof tipoDado !== 'string') return 20;
  const match = tipoDado.match(/d(\d+)/);
  return match ? parseInt(match[1], 10) : 20;
};

export const rolarDados = (tipoDado: string = 'd20', descricao: string = '') => {
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

export const formatarInformacoesPersonagem = (personagem: PersonagemBasico | null | undefined) => {
  if (!personagem) {
    return { nome: 'Personagem nao encontrado', classe: 'Desconhecida', raca: 'Desconhecida', nivel: '1', hp: '???', mp: '???', xp: '0' };
  }
  const manaMax = calcularMana(personagem as unknown as Parameters<typeof calcularMana>[0]);
  return {
    nome: personagem.nome || 'Personagem sem nome',
    classe: personagem.classe_nome || personagem.classe || 'Desconhecida',
    raca: personagem.raca_nome || personagem.raca || 'Desconhecida',
    nivel: personagem.nivel || '1',
    hp: personagem.hp_atual ?? personagem.hp ?? '???',
    hp_max: personagem.hp_max || personagem.hp_maximo || calcularHPMaximo(personagem as unknown as Parameters<typeof calcularHPMaximo>[0]),
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

export const formatarParticipantes = (participantes: ParticipanteBasico[] | null | undefined, user: UserBasico | null | undefined) => {
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
