/**
 * Criterio unico de classificacao de magia.
 * Uma habilidade e magia se possui escola_magia preenchida e diferente de 'nenhuma'.
 */
export const isSpellAction = (item) =>
  Boolean(item?.escola_magia && item.escola_magia !== 'nenhuma');
