export const BLUEPRINT_MODES = {
  INITIAL: 'initial',
  REGENERATE: 'regenerate',
  DARKER: 'darker',
  EXPLORATION: 'exploration',
  INTRIGUE: 'intrigue',
  POLITICAL: 'political',
};

export const MODE_LABELS = {
  initial: 'Proposta inicial (equilibrada)',
  regenerate: 'Alternativa (direção diferente)',
  darker: 'Tom sombrio (moral ambígua, tragédia)',
  exploration: 'Foco em exploração (segredos, áreas)',
  intrigue: 'Foco em intriga (traição, espionagem)',
  political: 'Foco político (facções, poder)',
};

export const MODE_TEMPERATURES = {
  initial: 0.3,
  regenerate: 0.7,
  darker: 0.6,
  exploration: 0.6,
  intrigue: 0.6,
  political: 0.6,
};

export function isValidMode(mode) {
  return Object.values(BLUEPRINT_MODES).includes(mode);
}
