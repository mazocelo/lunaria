import type { TipoLocal } from '../../mapEngine';

/**
 * Direcao de arte de um local: paleta, materiais e atmosfera.
 *
 * Existe para que cada lugar PARECA aquele lugar — uma cripta gelada nao pode
 * ter a mesma cara de um templo submerso. A IA preenche isso ao gerar a imagem
 * do local (campo `direcao_arte` no roteiro), mas o render NUNCA depende dela:
 * `resolverDirecaoArte` cai num default por `tipo`, entao locais sem imagem
 * continuam bonitos e coerentes.
 *
 * Todos os campos sao opcionais de proposito. A direcao vem de um LLM e chega
 * incompleta na pratica; cada buraco e preenchido pelo default do tipo, campo a
 * campo, em vez de derrubar o objeto inteiro.
 */

export interface Paleta {
  piso: string;
  parede: string;
  /** Props, molduras e detalhes que precisam saltar do fundo. */
  acento: string;
  /** Fundo da cena e cor da nevoa. */
  ambiente: string;
}

export type Textura = 'pedra' | 'tijolo' | 'madeira' | 'areia' | 'gelo' | 'musgo' | 'metal';

export interface Materiais {
  textura: Textura;
  rugosidade: number;
  metalico: number;
}

export interface Atmosfera {
  luzCor: string;
  luzIntensidade: number;
  /** 0 = ar limpo; 1 = densa. Multiplica a distancia da nevoa. */
  nevoaDensidade: number;
}

export interface DirecaoArte {
  paleta: Paleta;
  materiais: Materiais;
  atmosfera: Atmosfera;
}

/** Forma crua vinda da API — tudo opcional, nada confiavel. */
export interface DirecaoArteParcial {
  paleta?: Partial<Paleta> | null;
  materiais?: Partial<Materiais> | null;
  atmosfera?: Partial<Atmosfera> | null;
}

const TEXTURAS_VALIDAS: readonly Textura[] = ['pedra', 'tijolo', 'madeira', 'areia', 'gelo', 'musgo', 'metal'];

/**
 * Defaults por tipo de local. Sao o piso de qualidade do render: escolhidos
 * para cada arquetipo ja nascer com identidade propria, sem nenhuma chamada de
 * IA.
 */
const PADRAO: Record<TipoLocal, DirecaoArte> = {
  dungeon: {
    paleta: { piso: '#8b95a6', parede: '#626d80', acento: '#f59e0b', ambiente: '#1a2336' },
    materiais: { textura: 'pedra', rugosidade: 0.92, metalico: 0.04 },
    atmosfera: { luzCor: '#ffd9a0', luzIntensidade: 1.35, nevoaDensidade: 0.4 },
  },
  ruina: {
    paleta: { piso: '#949a80', parede: '#6d7364', acento: '#a3b18a', ambiente: '#1c231e' },
    materiais: { textura: 'musgo', rugosidade: 0.98, metalico: 0.0 },
    atmosfera: { luzCor: '#dfe7c8', luzIntensidade: 1.15, nevoaDensidade: 0.4 },
  },
  templo: {
    paleta: { piso: '#d6c7a1', parede: '#b0a184', acento: '#eab308', ambiente: '#1a1608' },
    materiais: { textura: 'pedra', rugosidade: 0.65, metalico: 0.18 },
    atmosfera: { luzCor: '#fff0c4', luzIntensidade: 1.4, nevoaDensidade: 0.3 },
  },
  caverna: {
    paleta: { piso: '#8d857a', parede: '#645c52', acento: '#38bdf8', ambiente: '#161d28' },
    materiais: { textura: 'pedra', rugosidade: 1.0, metalico: 0.0 },
    atmosfera: { luzCor: '#a9d6ff', luzIntensidade: 1.1, nevoaDensidade: 0.6 },
  },
  fortaleza: {
    paleta: { piso: '#8e9cb2', parede: '#67758c', acento: '#dc2626', ambiente: '#1a2334' },
    materiais: { textura: 'tijolo', rugosidade: 0.8, metalico: 0.12 },
    atmosfera: { luzCor: '#ffe8c2', luzIntensidade: 1.2, nevoaDensidade: 0.35 },
  },
  cidade: {
    paleta: { piso: '#a09891', parede: '#78716a', acento: '#fbbf24', ambiente: '#1b2234' },
    materiais: { textura: 'tijolo', rugosidade: 0.75, metalico: 0.05 },
    atmosfera: { luzCor: '#ffe4b5', luzIntensidade: 1.3, nevoaDensidade: 0.25 },
  },
  floresta: {
    paleta: { piso: '#5f9445', parede: '#4d7718', acento: '#facc15', ambiente: '#132417' },
    materiais: { textura: 'musgo', rugosidade: 1.0, metalico: 0.0 },
    atmosfera: { luzCor: '#d9f99d', luzIntensidade: 1.25, nevoaDensidade: 0.5 },
  },
  montanha: {
    paleta: { piso: '#8a8578', parede: '#5f5a50', acento: '#e2e8f0', ambiente: '#121a24' },
    materiais: { textura: 'pedra', rugosidade: 0.95, metalico: 0.02 },
    atmosfera: { luzCor: '#e8f2ff', luzIntensidade: 1.35, nevoaDensidade: 0.65 },
  },
  outro: {
    paleta: { piso: '#8e9bb0', parede: '#5b6a80', acento: '#c084fc', ambiente: '#1a2436' },
    materiais: { textura: 'pedra', rugosidade: 0.9, metalico: 0.05 },
    atmosfera: { luzCor: '#ffffff', luzIntensidade: 1.3, nevoaDensidade: 0.4 },
  },
};

/** Aceita `#rgb` e `#rrggbb`; qualquer outra coisa e descartada. */
function corValida(valor: unknown): string | null {
  return typeof valor === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(valor.trim())
    ? valor.trim()
    : null;
}

function numeroEmFaixa(valor: unknown, min: number, max: number): number | null {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return null;
  return Math.min(Math.max(valor, min), max);
}

/**
 * Funde a direcao vinda da IA sobre o default do tipo, campo a campo.
 *
 * Sanitiza tudo: a origem e um LLM, entao um `paleta.piso` com valor invalido
 * viraria material preto no three.js sem erro nenhum — uma cena quebrada e
 * silenciosa. Valor invalido cai no default em vez de passar adiante.
 */
export function resolverDirecaoArte(tipo: TipoLocal, bruta?: DirecaoArteParcial | null): DirecaoArte {
  const base = PADRAO[tipo] ?? PADRAO.outro;
  if (!bruta || typeof bruta !== 'object') return base;

  const textura = bruta.materiais?.textura;

  return {
    paleta: {
      piso: corValida(bruta.paleta?.piso) ?? base.paleta.piso,
      parede: corValida(bruta.paleta?.parede) ?? base.paleta.parede,
      acento: corValida(bruta.paleta?.acento) ?? base.paleta.acento,
      ambiente: corValida(bruta.paleta?.ambiente) ?? base.paleta.ambiente,
    },
    materiais: {
      textura: TEXTURAS_VALIDAS.includes(textura as Textura) ? (textura as Textura) : base.materiais.textura,
      rugosidade: numeroEmFaixa(bruta.materiais?.rugosidade, 0, 1) ?? base.materiais.rugosidade,
      metalico: numeroEmFaixa(bruta.materiais?.metalico, 0, 1) ?? base.materiais.metalico,
    },
    atmosfera: {
      luzCor: corValida(bruta.atmosfera?.luzCor) ?? base.atmosfera.luzCor,
      // Teto em 3: acima disso a cena estoura em branco e o mapa fica ilegivel.
      luzIntensidade: numeroEmFaixa(bruta.atmosfera?.luzIntensidade, 0.2, 3) ?? base.atmosfera.luzIntensidade,
      nevoaDensidade: numeroEmFaixa(bruta.atmosfera?.nevoaDensidade, 0, 1) ?? base.atmosfera.nevoaDensidade,
    },
  };
}

export const TEXTURAS_DISPONIVEIS = TEXTURAS_VALIDAS;
