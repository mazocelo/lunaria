/**
 * Contrato de dados do motor de mapas.
 *
 * O motor NAO conhece three.js nem React: ele produz um `MapaLayout` puro, que
 * o renderizador traduz em geometria. Essa separacao mantem a geracao testavel
 * com testes de unidade comuns e permite trocar o renderizador (ou gerar uma
 * minimapa 2D a partir do mesmo layout) sem tocar na geracao.
 *
 * Unidades: 1 unidade de grid = 1 metro no mundo 3D. Eixos seguem three.js —
 * X e Z sao o plano do chao, Y e a altura.
 */

/** Tipos observados em `roteiro.locais[].tipo` (ver taxonomia real no banco). */
export type TipoLocal =
  | 'dungeon'
  | 'ruina'
  | 'templo'
  | 'caverna'
  | 'fortaleza'
  | 'cidade'
  | 'floresta'
  | 'montanha'
  | 'outro';

/**
 * Familia de geracao. Varios `TipoLocal` compartilham a mesma estrategia
 * geometrica — dungeon/ruina/templo/caverna/fortaleza sao todos grafos de salas
 * conectadas por corredores, mudando so proporcao e decoracao.
 */
export type Arquetipo = 'interior' | 'urbano' | 'natural';

/** Papel narrativo da sala; dirige cor, iluminacao e marcadores no render. */
export type PapelSala = 'entrada' | 'comum' | 'encontro' | 'segredo' | 'final';

export interface Sala {
  id: string;
  /** Canto minimo no grid (metros). */
  x: number;
  z: number;
  largura: number;
  profundidade: number;
  altura: number;
  papel: PapelSala;
  /** Rotulo exibido no render (nome do segredo, do encontro, etc.). */
  rotulo?: string;
}

export interface Corredor {
  deSalaId: string;
  paraSalaId: string;
  /** Polilinha em L no plano XZ, ligando os centros das duas salas. */
  pontos: Array<{ x: number; z: number }>;
  largura: number;
}

export interface LimitesMapa {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface MapaLayout {
  /** Seed efetiva usada; expor permite reproduzir e depurar um mapa especifico. */
  seed: number;
  nome: string;
  tipo: TipoLocal;
  arquetipo: Arquetipo;
  salas: Sala[];
  corredores: Corredor[];
  limites: LimitesMapa;
}

/**
 * Entrada do motor: o subconjunto de `roteiro.locais[]` que importa para a
 * geometria. Todos os campos sao opcionais porque o roteiro e gerado por LLM e
 * na pratica aparece incompleto (ha historia em producao com apenas
 * `{nome: 'Local Central', tipo: 'outro'}`). O motor precisa produzir um mapa
 * valido mesmo assim.
 */
export interface LocalRoteiro {
  nome?: string;
  tipo?: string;
  descricao?: string;
  segredos?: string[];
  monstros_comuns?: string[];
}
