export interface DocsSidebarItem {
  slug: string;
  label: string;
}

const SIDEBAR_ITEMS: DocsSidebarItem[] = [
  { slug: 'index', label: 'Início' },
  { slug: 'como-jogar', label: 'Como Jogar' },
  { slug: 'atributos', label: 'Atributos' },
  { slug: 'combate', label: 'Combate' },
  { slug: 'progressao', label: 'Progressão' },
];

export function useDocsJogadorModel() {
  return { items: SIDEBAR_ITEMS, section: 'jogador' as const, title: 'Guia do Jogador' };
}
