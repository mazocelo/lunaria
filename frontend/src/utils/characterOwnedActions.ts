import { isSpellAction } from './isSpellAction';

/**
 * Acoes ativaveis do personagem (habilidades, magias, vantagens com `usar/usos`).
 * Shape solto porque cada engine de sistema gera entradas diferentes — todas
 * compartilham `id` e `nome` opcionais, e algumas tem `usar`/`usos` e
 * `escola_magia` (usado pelo `isSpellAction`).
 */
export interface OwnedAction {
  id?: string | number;
  nome?: string;
  usar?: number | string | null;
  usos?: number | string | null;
  escola_magia?: string | null;
  [key: string]: unknown;
}

export interface PersonagemAcoes {
  habilidadesClasse?: OwnedAction[];
  habilidadesProprias?: OwnedAction[];
  habilidadesConhecidas?: OwnedAction[];
  habilidadesAtivas?: OwnedAction[];
  habilidadesSelecionadas?: OwnedAction[];
  magias?: OwnedAction[];
  magiasProprias?: OwnedAction[];
  magiasConhecidas?: OwnedAction[];
  magiasPreparadas?: OwnedAction[];
  magiasAtivas?: OwnedAction[];
  magiasSelecionadas?: OwnedAction[];
  vantagens?: OwnedAction[];
  [key: string]: unknown;
}

export interface OwnedCombatActions {
  habilidades: OwnedAction[];
  magias: OwnedAction[];
  vantagensAtivaveis: OwnedAction[];
}

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const normalizeUses = (item: OwnedAction): number => {
  const value = item?.usar ?? item?.usos ?? 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const dedupeActions = (items: OwnedAction[] = []): OwnedAction[] => {
  const seenById = new Set<string>();
  const seenByName = new Set<string>();
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

const getExplicitOwnedSkills = (personagem: PersonagemAcoes = {}): OwnedAction[] =>
  dedupeActions([
    ...asArray<OwnedAction>(personagem.habilidadesClasse),
    ...asArray<OwnedAction>(personagem.habilidadesProprias),
    ...asArray<OwnedAction>(personagem.habilidadesConhecidas),
    ...asArray<OwnedAction>(personagem.habilidadesAtivas),
    ...asArray<OwnedAction>(personagem.habilidadesSelecionadas),
  ]);

const getExplicitOwnedSpells = (personagem: PersonagemAcoes = {}): OwnedAction[] =>
  dedupeActions([
    ...asArray<OwnedAction>(personagem.magias),
    ...asArray<OwnedAction>(personagem.magiasProprias),
    ...asArray<OwnedAction>(personagem.magiasConhecidas),
    ...asArray<OwnedAction>(personagem.magiasPreparadas),
    ...asArray<OwnedAction>(personagem.magiasAtivas),
    ...asArray<OwnedAction>(personagem.magiasSelecionadas),
  ]);

export const getActivatableAdvantages = (personagem: PersonagemAcoes = {}): OwnedAction[] =>
  dedupeActions(
    asArray<OwnedAction>(personagem.vantagens).filter((vantagem) => normalizeUses(vantagem) >= 1)
  );

export const getOwnedCombatActions = (personagem: PersonagemAcoes = {}): OwnedCombatActions => {
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
