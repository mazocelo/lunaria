import { isSpellAction } from './isSpellAction.js';

const asArray = (value) => (Array.isArray(value) ? value : []);

const normalizeUses = (item) => {
  const value = item?.usar ?? item?.usos ?? 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const dedupeActions = (items = []) => {
  const seenById = new Set();
  const seenByName = new Set();
  return items.filter((item) => {
    if (!item?.nome) return false;
    const prefix = isSpellAction(item) ? 'mag' : 'hab';
    const idKey = `${prefix}:${item?.id ?? item.nome}`;
    const nameKey = `${prefix}:${item.nome.toLowerCase()}`;
    if (seenById.has(idKey) || seenByName.has(nameKey)) return false;
    seenById.add(idKey);
    seenByName.add(nameKey);
    return true;
  });
};

const getExplicitOwnedSkills = (personagem = {}) =>
  dedupeActions([
    ...asArray(personagem.habilidadesClasse),
    ...asArray(personagem.habilidadesProprias),
    ...asArray(personagem.habilidadesConhecidas),
    ...asArray(personagem.habilidadesAtivas),
    ...asArray(personagem.habilidadesSelecionadas),
  ]);

const getExplicitOwnedSpells = (personagem = {}) =>
  dedupeActions([
    ...asArray(personagem.magias),
    ...asArray(personagem.magiasProprias),
    ...asArray(personagem.magiasConhecidas),
    ...asArray(personagem.magiasPreparadas),
    ...asArray(personagem.magiasAtivas),
    ...asArray(personagem.magiasSelecionadas),
  ]);

export const getActivatableAdvantages = (personagem = {}) =>
  dedupeActions(asArray(personagem.vantagens).filter((vantagem) => normalizeUses(vantagem) >= 1));

export const getOwnedCombatActions = (personagem = {}) => {
  const vantagensAtivaveis = getActivatableAdvantages(personagem);
  const habilidadesExplicitas = getExplicitOwnedSkills(personagem);
  const magiasExplicitas = getExplicitOwnedSpells(personagem);

  return {
    habilidades: dedupeActions([
      ...habilidadesExplicitas.filter((item) => !isSpellAction(item)),
      ...vantagensAtivaveis.filter((item) => !isSpellAction(item)),
    ]),
    magias: dedupeActions([
      ...magiasExplicitas.filter((item) => isSpellAction(item)),
      ...vantagensAtivaveis.filter((item) => isSpellAction(item)),
    ]),
    vantagensAtivaveis,
  };
};

export default {
  getActivatableAdvantages,
  getOwnedCombatActions,
};
