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
  'montanha',
  'outro',
];

/**
 * Sinonimos que o LLM produz na pratica.
 *
 * `blueprintService.js` do backend oferece um enum no prompt mas NUNCA valida o
 * campo, e `PUT /historias/:id/roteiro` aceita qualquer string — entao o
 * vocabulario real e aberto. Sem esta tabela, "montanha" (que o proprio prompt
 * do backend sugere) caia em 'outro' e era renderizada como masmorra fechada.
 *
 * A tabela vem completa de proposito: cada valor acrescentado depois muda
 * `normalizarTipo`, que muda `derivarSeed`, que repinta plantas ja vistas pelos
 * jogadores. Como nao ha layout persistido, esse repintar nao tem migracao —
 * por isso e melhor pagar de uma vez. Ver os vetores dourados em
 * `__tests__/mapEngine/`.
 */
const SINONIMOS: Readonly<Record<string, TipoLocal>> = {
  masmorra: 'dungeon',
  calabouco: 'dungeon',
  cripta: 'dungeon',
  catacumba: 'dungeon',
  catacumbas: 'dungeon',
  ruinas: 'ruina',
  santuario: 'templo',
  igreja: 'templo',
  cavernas: 'caverna',
  gruta: 'caverna',
  castelo: 'fortaleza',
  forte: 'fortaleza',
  torre: 'fortaleza',
  vila: 'cidade',
  aldeia: 'cidade',
  povoado: 'cidade',
  vilarejo: 'cidade',
  mata: 'floresta',
  bosque: 'floresta',
  selva: 'floresta',
  colina: 'montanha',
  montanhas: 'montanha',
  serra: 'montanha',
  pico: 'montanha',
};

const ARQUETIPO_POR_TIPO: Record<TipoLocal, Arquetipo> = {
  dungeon: 'interior',
  ruina: 'interior',
  templo: 'interior',
  caverna: 'interior',
  fortaleza: 'interior',
  outro: 'interior',
  cidade: 'urbano',
  floresta: 'natural',
  // Montanha e terreno aberto: clareiras e trilhas, nao comodos fechados.
  montanha: 'natural',
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
  if ((TIPOS_VALIDOS as readonly string[]).includes(limpo)) return limpo as TipoLocal;
  return SINONIMOS[limpo] ?? 'outro';
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
