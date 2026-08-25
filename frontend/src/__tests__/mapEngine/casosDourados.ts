import type { LocalRoteiro } from '../../mapEngine';

/**
 * Entradas fixas dos vetores dourados.
 *
 * Vive em arquivo proprio porque e consumido tanto pelo teste que VERIFICA os
 * vetores quanto pelo script que os REGENERA — os dois precisam usar exatamente
 * a mesma lista, senao o snapshot deixa de cobrir o que diz cobrir.
 *
 * NAO altere um caso existente sem regenerar `vetoresDourados.json` de forma
 * deliberada: mudar `nome` ou `tipo` muda a seed (`derivarSeed`) e repinta a
 * planta. Para cobrir algo novo, ACRESCENTE um caso.
 */
export interface CasoDourado {
  id: string;
  historiaId: number;
  local: LocalRoteiro;
}

/** Local real do roteiro da historia 1 em producao. */
const CATACUMBAS: LocalRoteiro = {
  nome: 'Catacumbas de Aethelburg',
  tipo: 'dungeon',
  descricao: 'Labirinto subterraneo sob a Academia.',
  segredos: [
    'Diario de Elara detalhando sua corrupcao inicial',
    'Mapa astral mostrando localizacao dos Fragmentos',
    'Portal menor ainda ativo para plano demoniaco',
  ],
  monstros_comuns: ['Dretch', 'Lemure', 'Manes', 'Esqueleto', 'Ghoul', 'Imp'],
};

export const CASOS_DOURADOS: CasoDourado[] = [
  { id: 'dungeon-rico', historiaId: 1, local: CATACUMBAS },
  // Mesmo nome e tipo, sem conteudo: isola o efeito de segredos/monstros no
  // numero de salas (a seed e identica ao caso acima).
  { id: 'dungeon-vazio', historiaId: 1, local: { nome: 'Catacumbas de Aethelburg', tipo: 'dungeon' } },
  { id: 'templo', historiaId: 1, local: { ...CATACUMBAS, tipo: 'templo' } },
  { id: 'caverna', historiaId: 1, local: { ...CATACUMBAS, tipo: 'caverna' } },
  { id: 'ruina', historiaId: 1, local: { ...CATACUMBAS, tipo: 'ruina' } },
  { id: 'fortaleza', historiaId: 1, local: { ...CATACUMBAS, tipo: 'fortaleza' } },
  { id: 'outro', historiaId: 1, local: { ...CATACUMBAS, tipo: 'outro' } },
  { id: 'cidade', historiaId: 2, local: { nome: 'Porto de Mare Negra', tipo: 'cidade', segredos: ['Contrabando'], monstros_comuns: ['Bandido', 'Espiao'] } },
  { id: 'floresta', historiaId: 2, local: { nome: 'Mata dos Lamentos', tipo: 'floresta', segredos: ['Circulo de pedras'], monstros_comuns: ['Lobo', 'Aranha'] } },
  // Caso degenerado real: a historia 3 tem exatamente este local, com os
  // placeholders que `blueprintService` escreve quando o LLM nao preenche.
  {
    id: 'degenerado',
    historiaId: 3,
    local: {
      nome: 'Local Central',
      tipo: 'outro',
      descricao: 'Sem descricao',
      segredos: ['Nenhum segredo definido'],
      monstros_comuns: ['Nenhum'],
    },
  },
  { id: 'minimo', historiaId: 99, local: { nome: 'X' } },
  // Tipo que o prompt do backend sugere e que antes caia em 'outro' -> interior
  // (montanha renderizada como masmorra fechada).
  { id: 'montanha', historiaId: 2, local: { nome: 'Pico Cinzento', tipo: 'montanha', segredos: ['Ninho de grifos'], monstros_comuns: ['Grifo'] } },
  // Sinonimos: garantem que a tabela mapeia para o arquetipo certo.
  { id: 'sinonimo-vila', historiaId: 2, local: { nome: 'Vilarejo do Vau', tipo: 'vila' } },
  { id: 'sinonimo-masmorra', historiaId: 2, local: { nome: 'Poco Fundo', tipo: 'masmorra' } },
  { id: 'sinonimo-colina', historiaId: 2, local: { nome: 'Colina Rasa', tipo: 'colina' } },
];
