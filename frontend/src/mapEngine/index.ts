import { gerarInterior } from './archetypes/interior';
import { gerarNatural, gerarUrbano } from './archetypes/urbanoNatural';
import { criarRng, hashSeed } from './rng';
import type { Arquetipo, LocalRoteiro, MapaLayout, TipoLocal } from './types';

export type { Arquetipo, LocalRoteiro, MapaLayout, PapelSala, Sala, Corredor, TipoLocal } from './types';
export { hashSeed } from './rng';

const TIPOS_VALIDOS: readonly TipoLocal[] = [
  'dungeon',
  'ruina',
  'templo',
  'caverna',
  'fortaleza',
  'cidade',
  'floresta',
  'outro',
];

const ARQUETIPO_POR_TIPO: Record<TipoLocal, Arquetipo> = {
  dungeon: 'interior',
  ruina: 'interior',
  templo: 'interior',
  caverna: 'interior',
  fortaleza: 'interior',
  outro: 'interior',
  cidade: 'urbano',
  floresta: 'natural',
};

/**
 * Normaliza `tipo` vindo do roteiro. O campo e texto livre produzido por LLM,
 * entao chega com caixa e acentuacao variaveis ('Dungeon', 'Ruína'); qualquer
 * valor irreconhecivel vira 'outro' em vez de quebrar a geracao.
 */
export function normalizarTipo(tipo?: string): TipoLocal {
  if (!tipo) return 'outro';
  const limpo = tipo
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return (TIPOS_VALIDOS as readonly string[]).includes(limpo) ? (limpo as TipoLocal) : 'outro';
}

/**
 * Deriva a seed do mapa.
 *
 * Precisa ser estavel entre clientes e entre sessoes: dois jogadores abrindo o
 * mesmo local tem de ver a mesma planta, e reabrir amanha nao pode gerar outra.
 * Por isso a seed sai do conteudo (historia + nome do local), nunca de tempo ou
 * de Math.random.
 */
export function derivarSeed(historiaId: number | string, local: LocalRoteiro): number {
  return hashSeed(`${historiaId}::${local.nome ?? 'sem-nome'}::${normalizarTipo(local.tipo)}`);
}

/**
 * Ponto de entrada do motor: transforma um local do roteiro em layout 3D.
 *
 * Puro e deterministico — mesma entrada, mesma saida, sempre. Nao toca em rede,
 * relogio nem estado global, o que o torna testavel sem mocks e seguro de rodar
 * durante o render.
 */
export function gerarMapa(historiaId: number | string, local: LocalRoteiro): MapaLayout {
  const tipo = normalizarTipo(local.tipo);
  const seed = derivarSeed(historiaId, local);
  const rng = criarRng(seed);

  const nome = local.nome?.trim() || 'Local sem nome';
  // Filtra os placeholders que o gerador de roteiro escreve quando o LLM nao
  // preenche o campo; sem isso, "Nenhum segredo definido" viraria uma sala
  // secreta rotulada com essa frase.
  const segredos = limparPlaceholders(local.segredos);
  const monstros = limparPlaceholders(local.monstros_comuns);

  switch (ARQUETIPO_POR_TIPO[tipo]) {
    case 'urbano':
      return gerarUrbano(rng, seed, nome, tipo, segredos, monstros);
    case 'natural':
      return gerarNatural(rng, seed, nome, tipo, segredos, monstros);
    default:
      return gerarInterior(rng, seed, nome, tipo, segredos, monstros);
  }
}

const PLACEHOLDERS = [/^nenhum/i, /^sem\s/i, /^n\/a$/i, /^-$/, /^nao definido/i];

function limparPlaceholders(itens?: string[]): string[] {
  if (!Array.isArray(itens)) return [];
  return itens
    .filter((i): i is string => typeof i === 'string')
    .map((i) => i.trim())
    .filter((i) => i.length > 0 && !PLACEHOLDERS.some((p) => p.test(i)));
}
