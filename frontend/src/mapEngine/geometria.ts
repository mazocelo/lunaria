import type { Corredor, LimitesMapa, Sala } from './types';
import type { Rng } from './rng';

/** Retangulo no plano XZ; base de colisao para posicionar salas/predios. */
export interface Retangulo {
  x: number;
  z: number;
  largura: number;
  profundidade: number;
}

/**
 * Colisao AABB com folga. `margem` garante espaco para parede e corredor entre
 * duas salas — sem ela, salas encostadas viram um comodo unico no render.
 */
export function colidem(a: Retangulo, b: Retangulo, margem = 2): boolean {
  return (
    a.x - margem < b.x + b.largura &&
    a.x + a.largura + margem > b.x &&
    a.z - margem < b.z + b.profundidade &&
    a.z + a.profundidade + margem > b.z
  );
}

export function centro(r: Retangulo): { x: number; z: number } {
  return { x: r.x + r.largura / 2, z: r.z + r.profundidade / 2 };
}

/**
 * Corredor em L entre dois centros. Alterna qual eixo anda primeiro para os
 * corredores nao ficarem todos com a mesma "dobra", o que denuncia geracao
 * procedural a olho nu.
 */
export function corredorEmL(
  deSalaId: string,
  paraSalaId: string,
  a: { x: number; z: number },
  b: { x: number; z: number },
  larguraCorredor: number,
  horizontalPrimeiro: boolean,
): Corredor {
  const cotovelo = horizontalPrimeiro ? { x: b.x, z: a.z } : { x: a.x, z: b.z };
  return {
    deSalaId,
    paraSalaId,
    pontos: [a, cotovelo, b],
    largura: larguraCorredor,
  };
}

/** Envelope de tudo que foi gerado; o renderizador usa para enquadrar a camera. */
export function calcularLimites(salas: Sala[]): LimitesMapa {
  if (salas.length === 0) return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
  return salas.reduce<LimitesMapa>(
    (acc, s) => ({
      minX: Math.min(acc.minX, s.x),
      maxX: Math.max(acc.maxX, s.x + s.largura),
      minZ: Math.min(acc.minZ, s.z),
      maxZ: Math.max(acc.maxZ, s.z + s.profundidade),
    }),
    {
      minX: salas[0].x,
      maxX: salas[0].x + salas[0].largura,
      minZ: salas[0].z,
      maxZ: salas[0].z + salas[0].profundidade,
    },
  );
}

const DIRECOES = [
  { dx: 1, dz: 0 },
  { dx: -1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: 0, dz: -1 },
] as const;

/**
 * Posiciona um retangulo adjacente a `ancora`, sem colidir com `ocupados`.
 * Tenta as quatro direcoes em ordem embaralhada e varia o afastamento; devolve
 * null quando nao ha vaga, deixando a decisao (desistir ou reancorar) para o
 * gerador que chamou.
 */
export function posicionarAdjacente(
  rng: Rng,
  ancora: Retangulo,
  novo: { largura: number; profundidade: number },
  ocupados: Retangulo[],
  margem: number,
  espacamento: [number, number],
): Retangulo | null {
  for (const dir of rng.embaralhar(DIRECOES)) {
    for (let tentativa = 0; tentativa < 6; tentativa++) {
      const gap = rng.inteiro(espacamento[0], espacamento[1]);
      // Deslocamento lateral evita que tudo fique alinhado num eixo so.
      const desvio = rng.inteiro(-3, 3);

      const x =
        dir.dx === 0
          ? ancora.x + desvio
          : dir.dx > 0
            ? ancora.x + ancora.largura + gap
            : ancora.x - novo.largura - gap;
      const z =
        dir.dz === 0
          ? ancora.z + desvio
          : dir.dz > 0
            ? ancora.z + ancora.profundidade + gap
            : ancora.z - novo.profundidade - gap;

      const candidato: Retangulo = { x, z, largura: novo.largura, profundidade: novo.profundidade };
      if (!ocupados.some((o) => colidem(candidato, o, margem))) return candidato;
    }
  }
  return null;
}
