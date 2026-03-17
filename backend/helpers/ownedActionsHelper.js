function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeUses(item) {
  const value = item?.usar ?? item?.usos ?? 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSpellAction(item) {
  return Boolean(item?.escola_magia && item.escola_magia !== 'nenhuma');
}

function dedupeActions(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.nome) return false;
    const key = `${isSpellAction(item) ? 'mag' : 'hab'}:${item?.id ?? item.nome}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getExplicitOwnedSkills(personagemCompleto = {}) {
  return dedupeActions([
    ...asArray(personagemCompleto.habilidadesClasse),
    ...asArray(personagemCompleto.habilidadesProprias),
    ...asArray(personagemCompleto.habilidadesConhecidas),
    ...asArray(personagemCompleto.habilidadesAtivas),
    ...asArray(personagemCompleto.habilidadesSelecionadas),
  ]);
}

function getExplicitOwnedSpells(personagemCompleto = {}) {
  return dedupeActions([
    ...asArray(personagemCompleto.magias),
    ...asArray(personagemCompleto.magiasProprias),
    ...asArray(personagemCompleto.magiasConhecidas),
    ...asArray(personagemCompleto.magiasPreparadas),
    ...asArray(personagemCompleto.magiasAtivas),
    ...asArray(personagemCompleto.magiasSelecionadas),
  ]);
}

export function getActivatableAdvantages(personagemCompleto = {}) {
  return dedupeActions(
    asArray(personagemCompleto.vantagens).filter((vantagem) => normalizeUses(vantagem) >= 1)
  );
}

export function getOwnedCombatActions(personagemCompleto = {}) {
  const vantagensAtivaveis = getActivatableAdvantages(personagemCompleto);
  const habilidadesExplicitas = getExplicitOwnedSkills(personagemCompleto);
  const magiasExplicitas = getExplicitOwnedSpells(personagemCompleto);

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
}

export function getOwnedCombatActionList(personagemCompleto = {}) {
  const loadout = getOwnedCombatActions(personagemCompleto);
  return dedupeActions([...loadout.habilidades, ...loadout.magias]);
}

export default {
  getActivatableAdvantages,
  getOwnedCombatActions,
  getOwnedCombatActionList,
};
