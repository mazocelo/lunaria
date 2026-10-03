// src/Pages/Personagem/Wizard/stages/dnd.ts
const MAPA: Record<string, string> = {
  str: 'STR', for: 'STR', forca: 'STR', strength: 'STR',
  dex: 'DEX', des: 'DEX', destreza: 'DEX', dexterity: 'DEX',
  con: 'CON', constituicao: 'CON', constitution: 'CON',
  int: 'INT', inteligencia: 'INT', intelligence: 'INT',
  wis: 'WIS', sab: 'WIS', sabedoria: 'WIS', wisdom: 'WIS',
  cha: 'CHA', car: 'CHA', carisma: 'CHA', charisma: 'CHA',
};
const sem = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const objeto = (v: unknown): v is Record<string, unknown> => v != null && typeof v === 'object' && !Array.isArray(v);

function lerBonus(fonte: unknown): Record<string, number> {
  if (!objeto(fonte)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(fonte)) {
    const chave = MAPA[sem(k)];
    const n = Number(v);
    if (chave && Number.isFinite(n) && n !== 0) out[chave] = (out[chave] ?? 0) + n;
  }
  return out;
}

/**
 * Bônus racial D&D (chaves STR..CHA, só valores ≠ 0) para MOSTRAR na tela (L-14).
 * As raças D&D do seed guardam em `bonus.abilityBonuses`; `atributos_bonus` vem com as chaves Lunaria zeradas.
 * O POST de criação manda os valores da distribuição sem bônus: o backend valida o Conjunto Padrão.
 */
export function bonusRacialDnd(raca: { bonus?: unknown; atributos_bonus?: unknown } | null | undefined): Record<string, number> {
  const bonus = raca?.bonus;
  for (const fonte of [objeto(bonus) ? bonus.abilityBonuses : undefined, bonus, raca?.atributos_bonus]) {
    const lido = lerBonus(fonte);
    if (Object.keys(lido).length > 0) return lido;
  }
  return {};
}
