/**
 * Helpers RPG — fórmulas compartilhadas entre frontend e backend.
 * Manter em sincronia com Backend/helpers/combateHelper.js
 */

/**
 * Shape tolerante de personagem usado pelos helpers. Suporta os tres caminhos
 * em que personagens chegam aqui:
 *   1. DTO da API ja validado (`Personagem` de `@types/api`) — tem `atributos`
 *      como mapa flat e relacoes (`racas`, `raca`) resolvidas.
 *   2. Modelo do front com camelCase (`raca_nome`, escalares legados como
 *      `constituicao`, `inteligencia`, `carisma`) usado durante criacao.
 *   3. Fixtures mistas de teste.
 *
 * Os defaults `?? 10` para atributos D&D/Lunaria sao intencionais — fichas
 * antigas migradas sem `atributos_personagem` populado caem nesse fallback
 * sem quebrar o calculo de HP/mana.
 */
export interface PersonagemInput {
  sistema?: string;
  nivel?: number | null;
  atributos?: Record<string, number | undefined> | null;
  stats_sistema?: { temMagia?: boolean } | Record<string, unknown> | null;
  // Relacao de raca: resolvida pelo controller (`raca` string) ou pelo include
  // do Prisma (`racas: { nome }`).
  raca?: string | null;
  raca_nome?: string | null;
  // `racas` vem do include do Prisma e e tipado como `unknown` no Model do
  // front; o helper narrows defensivamente antes de ler `.nome`.
  racas?: unknown;
  // Escalares legados Lunaria (criacao via wizard antes de gravar atributos).
  // `null` aparece quando o Model do front inicializa antes de gravar atributos.
  constituicao?: number | null;
  inteligencia?: number | null;
  carisma?: number | null;
  // Escalar 3D&T (`R` de Resistencia) — usado quando `atributos.R` nao esta presente.
  R?: number | null;
}

/**
 * Multiplicador de HP por raca (tamanho).
 * Sincronia com Backend/helpers/combateHelper.js → getMultRaca()
 */
const MULT_RACA: Record<string, number> = {
  'humano': 5, 'anão': 6, 'elfo': 4, 'elfo negro': 4, 'meio-elfo': 5,
  'halfling': 4, 'gnomo': 4, 'orc': 7, 'meio-orc': 6, 'tiefling': 5,
  'draconato': 7, 'aasimar': 5, 'primordiano': 5, 'anfíbio': 5, 'centauro': 7,
  'minotauro': 7, 'kythari': 5, 'kemono': 5, 'pardalino': 4, 'kobold': 3,
  'goblin': 3, 'hobgoblin': 5, 'bugbear': 6, 'meio-dragão': 7,
  'ogro': 8, 'meio-ogro': 7, 'troglodita': 5, 'verdeante': 5,
  'cristálide': 5, 'anjo': 6, 'demônio': 6, 'meio-abissal': 6,
  'meio-celestial': 6, 'fada': 3, 'licantropo': 7, 'meio-gênio': 6,
  'silvagante': 7, 'deva': 6, 'androide': 6, 'golem': 9,
};

function getMultRaca(racaNome: string | null | undefined): number {
  if (!racaNome) return 5;
  return MULT_RACA[racaNome.toLowerCase()] || 5;
}

/**
 * Calcula HP máximo de um personagem.
 * Lunaria: multRaca × (nivel + max(1, modCON))
 * 3D&T: R × 5 (minimo 1)
 * Sincronia com Backend/helpers/combateHelper.js → calcularHP()
 */
export function calcularHPMaximo(personagem: PersonagemInput | null | undefined): number {
  if (personagem?.sistema === 'tresdet') {
    const R = Number(personagem?.atributos?.R ?? personagem?.R ?? 0) || 0;
    return Math.max(1, R * 5);
  }
  const constituicao = personagem?.atributos?.constituicao ?? personagem?.constituicao ?? 10;
  const nivel = personagem?.nivel || 1;
  const modCon = Math.floor((constituicao - 10) / 2);
  const racasNome =
    typeof personagem?.racas === 'object' && personagem?.racas !== null
      ? ((personagem.racas as { nome?: string | null }).nome ?? null)
      : null;
  const racaNome =
    (personagem?.raca_nome as string | undefined) ||
    racasNome ||
    personagem?.raca ||
    '';
  const mult = getMultRaca(racaNome);
  return mult * (nivel + Math.max(1, modCon));
}

/**
 * Calcula mana máxima de um personagem.
 * Lunaria: 10 + nivel + max(modINT, modCHA) × 2
 * 3D&T: R × 5 (somente se tem vantagem Magia)
 * Sincronia com Backend/helpers/combateHelper.js → calcularMana()
 */
export function calcularMana(personagem: PersonagemInput | null | undefined): number {
  if (personagem?.sistema === 'tresdet') {
    const temMagia = (personagem?.stats_sistema as { temMagia?: boolean } | null)?.temMagia;
    if (!temMagia) return 0;
    const R = Number(personagem?.atributos?.R ?? personagem?.R ?? 0) || 0;
    return Math.max(1, R * 5);
  }
  const inteligencia = personagem?.atributos?.inteligencia ?? personagem?.inteligencia ?? 10;
  const carisma = personagem?.atributos?.carisma ?? personagem?.carisma ?? 10;
  const nivel = personagem?.nivel || 1;
  const modInt = Math.floor((inteligencia - 10) / 2);
  const modCha = Math.floor((carisma - 10) / 2);
  return 10 + nivel + Math.max(modInt, modCha) * 2;
}

export function getDnd5eProficiencyBonus(nivel: number): number {
  if (nivel <= 4) return 2;
  if (nivel <= 8) return 3;
  if (nivel <= 12) return 4;
  if (nivel <= 16) return 5;
  return 6;
}

export function getDnd5eModifier(score: number | null | undefined): number {
  return Math.floor(((score || 10) - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}
