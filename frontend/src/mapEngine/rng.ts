/**
 * Aleatoriedade DETERMINISTICA para o motor de mapas.
 *
 * O jogo e multiplayer: varios jogadores abrem o mesmo local na mesma sessao.
 * Se a geracao usasse Math.random(), cada cliente veria um mapa diferente e o
 * Mestre nao poderia se referir a "a sala ao norte". Como toda a geracao deriva
 * de uma seed estavel (id da historia + nome do local), todo mundo produz
 * geometria byte a byte identica sem precisar persistir nada no banco nem
 * sincronizar via websocket.
 */

/** Hash string -> uint32 (xfnv1a). Estavel entre browsers e execucoes. */
export function hashSeed(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** PRNG mulberry32: rapido, sem dependencia e reproduzivel. */
export function criarRng(seed: number): Rng {
  let estado = seed >>> 0;

  const proximo = (): number => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    proximo,
    /** Inteiro em [min, max] inclusivo. */
    inteiro: (min: number, max: number) => min + Math.floor(proximo() * (max - min + 1)),
    /** Escolhe um item; lanca se a lista estiver vazia (bug do chamador, nao dado ruim). */
    escolher: <T>(itens: readonly T[]): T => {
      if (itens.length === 0) throw new Error('rng.escolher recebeu lista vazia');
      return itens[Math.floor(proximo() * itens.length)];
    },
    /** Fisher-Yates; devolve copia, nao muta a entrada. */
    embaralhar: <T>(itens: readonly T[]): T[] => {
      const copia = [...itens];
      for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(proximo() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
      }
      return copia;
    },
  };
}

export interface Rng {
  proximo(): number;
  inteiro(min: number, max: number): number;
  escolher<T>(itens: readonly T[]): T;
  embaralhar<T>(itens: readonly T[]): T[];
}
