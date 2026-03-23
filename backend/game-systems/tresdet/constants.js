/**
 * Constantes do sistema 3D&T Alpha.
 * Fonte unica para caracteristicas, tiers e limites do sistema.
 */

export const CARACTERISTICAS = [
  { id: 'F',   nome: 'Forca',        sigla: 'F',   min: 0, max: 5 },
  { id: 'H',   nome: 'Habilidade',   sigla: 'H',   min: 0, max: 5 },
  { id: 'R',   nome: 'Resistencia',  sigla: 'R',   min: 0, max: 5 },
  { id: 'A',   nome: 'Armadura',     sigla: 'A',   min: 0, max: 5 },
  { id: 'PdF', nome: 'Poder de Fogo', sigla: 'PdF', min: 0, max: 5 },
];

export const CARACTERISTICA_IDS = CARACTERISTICAS.map(c => c.id);

export const TIERS = {
  novato:   { nome: 'Novato',   pontos: 5,  maxDesv: 3, maxAttr: 3 },
  lutador:  { nome: 'Lutador',  pontos: 7,  maxDesv: 4, maxAttr: 4 },
  campeao:  { nome: 'Campeao',  pontos: 10, maxDesv: 5, maxAttr: 5 },
  lenda:    { nome: 'Lenda',    pontos: 12, maxDesv: 6, maxAttr: 5 },
};

export const FOCUS_KEYS = ['fogo', 'agua', 'terra', 'ar', 'luz', 'trevas'];

export const TIER_DEFAULT = 'lutador';
export const NIVEL_MAX = 10;
