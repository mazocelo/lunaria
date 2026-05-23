/**
 * Criterio unico de classificacao de magia.
 * Uma habilidade e magia se possui escola_magia preenchida e diferente de 'nenhuma'.
 *
 * Recebe `unknown` porque os callers passam itens de varios shapes
 * (habilidades de classe, magias preparadas, vantagens ativaveis) — todos
 * compartilham apenas o campo opcional `escola_magia`.
 */
export const isSpellAction = (item: unknown): boolean => {
  if (item == null || typeof item !== 'object') return false;
  const escola = (item as { escola_magia?: unknown }).escola_magia;
  return typeof escola === 'string' && escola.length > 0 && escola !== 'nenhuma';
};
