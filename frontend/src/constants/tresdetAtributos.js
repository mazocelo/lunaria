/**
 * Caracteristicas do sistema 3D&T (F/H/R/A/PdF).
 *
 * Constante de dados pura (sem JSX/React) para poder ser consumida tanto pela
 * camada View quanto pela camada Model. As `key` casam com o mapa `atributos`
 * retornado pelo backend para personagens 3D&T.
 */
export const TRESDET_ATTR_CONFIG = [
  { key: 'F', label: 'Forca', sigla: 'F', min: 0, max: 5, desc: 'Dano corpo a corpo', bar: 'bg-red-500' },
  { key: 'H', label: 'Habilidade', sigla: 'H', min: 0, max: 5, desc: 'Acerto, esquiva, iniciativa', bar: 'bg-purple-500' },
  { key: 'R', label: 'Resistencia', sigla: 'R', min: 0, max: 5, desc: 'HP e PM', bar: 'bg-green-500' },
  { key: 'A', label: 'Armadura', sigla: 'A', min: 0, max: 5, desc: 'Defesa contra ataques', bar: 'bg-blue-500' },
  { key: 'PdF', label: 'Poder de Fogo', sigla: 'PdF', min: 0, max: 5, desc: 'Dano a distancia', bar: 'bg-yellow-500' },
];
