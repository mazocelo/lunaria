import { calcularLimites, centro, colidem, corredorEmL, type Retangulo } from '../geometria';
import type { Rng } from '../rng';
import type { Corredor, MapaLayout, PapelSala, Sala, TipoLocal } from '../types';

/**
 * Arquetipos URBANO (cidade) e NATURAL (floresta).
 *
 * Sao poucos locais hoje (3 cidades e 1 floresta em 33), mas geram-se de forma
 * genuina em vez de cair no arquetipo de interior — uma cidade renderizada como
 * masmorra fechada ficaria simplesmente errada. Ambos reaproveitam `Sala` e
 * `Corredor`: na cidade uma "sala" e um quarteirao e um "corredor" e uma rua;
 * na floresta, uma clareira e uma trilha. O renderizador diferencia pelo campo
 * `arquetipo`.
 */

export function gerarUrbano(
  rng: Rng,
  seed: number,
  nome: string,
  tipo: TipoLocal,
  segredos: string[],
  monstros: string[],
): MapaLayout {
  // Malha regular de quarteiroes: e o que distingue visualmente uma cidade de
  // uma planta organica. Ruas sao as folgas entre as celulas da malha.
  const colunas = rng.inteiro(3, 5);
  const linhas = rng.inteiro(3, 5);
  const larguraRua = rng.inteiro(6, 9);

  const salas: Sala[] = [];
  const celulas: Array<{ i: number; retangulo: Retangulo }> = [];

  let cursorZ = 0;
  for (let l = 0; l < linhas; l++) {
    let cursorX = 0;
    const profundidade = rng.inteiro(10, 16);
    for (let c = 0; c < colunas; c++) {
      const largura = rng.inteiro(10, 18);
      // Lacunas viram pracas: uma malha 100% preenchida parece artificial.
      if (rng.proximo() > 0.18) {
        celulas.push({ i: salas.length, retangulo: { x: cursorX, z: cursorZ, largura, profundidade } });
        salas.push({
          id: `quarteirao-${salas.length}`,
          x: cursorX,
          z: cursorZ,
          largura,
          profundidade,
          altura: rng.inteiro(5, 14),
          papel: 'comum',
        });
      }
      cursorX += largura + larguraRua;
    }
    cursorZ += profundidade + larguraRua;
  }

  // Ruas ligando quarteiroes vizinhos na malha.
  const corredores: Corredor[] = [];
  for (let k = 1; k < celulas.length; k++) {
    corredores.push(
      corredorEmL(
        salas[celulas[k - 1].i].id,
        salas[celulas[k].i].id,
        centro(celulas[k - 1].retangulo),
        centro(celulas[k].retangulo),
        larguraRua,
        k % 2 === 0,
      ),
    );
  }

  aplicarPapeisNarrativos(rng, salas, segredos, monstros);

  return { seed, nome, tipo, arquetipo: 'urbano', salas, corredores, limites: calcularLimites(salas) };
}

export function gerarNatural(
  rng: Rng,
  seed: number,
  nome: string,
  tipo: TipoLocal,
  segredos: string[],
  monstros: string[],
): MapaLayout {
  // Clareiras espalhadas por dispersao radial, ligadas por trilhas sinuosas.
  const quantidade = rng.inteiro(5, 8) + Math.min(segredos.length, 3);
  const salas: Sala[] = [];
  const ocupados: Retangulo[] = [];

  for (let i = 0; i < quantidade; i++) {
    let colocada: Retangulo | null = null;
    for (let tentativa = 0; tentativa < 40 && !colocada; tentativa++) {
      const raio = 14 + i * rng.inteiro(6, 13);
      const angulo = rng.proximo() * Math.PI * 2;
      const lado = rng.inteiro(8, 16);
      const candidato: Retangulo = {
        x: Math.round(Math.cos(angulo) * raio),
        z: Math.round(Math.sin(angulo) * raio),
        largura: lado,
        profundidade: rng.inteiro(8, 16),
      };
      if (!ocupados.some((o) => colidem(candidato, o, 5))) colocada = candidato;
    }
    if (!colocada) continue;

    ocupados.push(colocada);
    salas.push({
      id: `clareira-${salas.length}`,
      x: colocada.x,
      z: colocada.z,
      largura: colocada.largura,
      profundidade: colocada.profundidade,
      altura: 0, // Clareira e aberta: sem paredes nem teto.
      papel: 'comum',
    });
  }

  const corredores: Corredor[] = [];
  for (let i = 1; i < salas.length; i++) {
    corredores.push(
      corredorEmL(
        salas[i - 1].id,
        salas[i].id,
        centro(ocupados[i - 1]),
        centro(ocupados[i]),
        rng.inteiro(3, 5),
        rng.proximo() < 0.5,
      ),
    );
  }

  aplicarPapeisNarrativos(rng, salas, segredos, monstros);

  return { seed, nome, tipo, arquetipo: 'natural', salas, corredores, limites: calcularLimites(salas) };
}

/** Muta `salas` no lugar: entrada/final nas pontas, segredos e encontros no miolo. */
function aplicarPapeisNarrativos(rng: Rng, salas: Sala[], segredos: string[], monstros: string[]): void {
  if (salas.length === 0) return;

  salas[0].papel = 'entrada';
  if (salas.length > 1) salas[salas.length - 1].papel = 'final';

  const miolo = rng.embaralhar(
    salas.map((_, i) => i).filter((i) => salas[i].papel === ('comum' as PapelSala)),
  );

  let cursor = 0;
  for (const segredo of segredos.slice(0, 3)) {
    if (cursor >= miolo.length) break;
    salas[miolo[cursor]].papel = 'segredo';
    salas[miolo[cursor]].rotulo = segredo;
    cursor++;
  }
  for (let i = 0; i < monstros.length && cursor < miolo.length; i += 2) {
    salas[miolo[cursor]].papel = 'encontro';
    salas[miolo[cursor]].rotulo = monstros.slice(i, i + 2).join(', ');
    cursor++;
  }
}
