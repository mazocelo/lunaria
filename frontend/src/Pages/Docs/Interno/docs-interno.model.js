const INTERNO_ITEMS = [
  { slug: 'index', label: 'Início' },
  { slug: 'formulas', label: 'Fórmulas' },
  { slug: 'engine', label: 'Game Engine' },
  { slug: 'mestre-ia', label: 'Mestre IA' },
  { slug: 'combate-engine', label: 'Combat Engine' },
];

const JOGADOR_ITEMS = [
  { slug: 'como-jogar', label: 'Como Jogar' },
  { slug: 'atributos', label: 'Atributos' },
  { slug: 'combate', label: 'Combate' },
  { slug: 'progressao', label: 'Progressão' },
];

export function useDocsInternoModel() {
  return {
    internoItems: INTERNO_ITEMS,
    jogadorItems: JOGADOR_ITEMS,
    title: 'Base de Conhecimento',
  };
}
