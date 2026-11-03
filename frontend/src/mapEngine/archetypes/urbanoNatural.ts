import { calcularLimites, centro, colidem, corredorEmL, type Retangulo } from '../geometria';
import type { Rng } from '../rng';
import type { Corredor, MapaLayout, PapelSala, Sala, TipoLocal } from '../types';

/**
 * Arquetipos URBANO (cidade) e NATURAL (floresta, montanha).
 *
 * Ambos reaproveitam `Sala` e `Corredor`: na cidade uma "sala" e um quarteirao e
 * um "corredor" e uma rua; no natural, uma clareira e uma trilha. O
 * renderizador diferencia pelo campo `arquetipo`.
 */

export function gerarUrbano(
  rng: Rng,
  seed: number,
  nome: string,
  tipo: TipoLocal,
  segredos: string[],
  monstros: string[],
): MapaLayout {
  const colunas = rng.inteiro(3, 5);
  const linhas = rng.inteiro(3, 5);
  const larguraRua = rng.inteiro(6, 9);

  // Larguras por COLUNA e profundidades por LINHA, sorteadas uma unica vez.
  //
  // Isto e o que torna a malha uma malha: todo quarteirao de uma coluna divide o
  // mesmo x e a mesma largura, e todo quarteirao de uma linha divide o mesmo z.
  // Como consequencia, ligar vizinhos produz ruas RETAS por construcao — nao ha
  // como uma rua cortar o interior de um quarteirao.
  //
  // Antes cada celula sorteava a propria largura, entao a coluna `c` da linha 0
  // nao ficava alinhada com a coluna `c` da linha 1; toda ligacao vertical virava
  // um "L" que atravessava o que estivesse no meio.
  const larguras = Array.from({ length: colunas }, () => rng.inteiro(10, 18));
  const profundidades = Array.from({ length: linhas }, () => rng.inteiro(10, 16));

  const xDaColuna: number[] = [];
  for (let c = 0, cursor = 0; c < colunas; c++) {
    xDaColuna.push(cursor);
    cursor += larguras[c] + larguraRua;
  }
  const zDaLinha: number[] = [];
  for (let l = 0, cursor = 0; l < linhas; l++) {
    zDaLinha.push(cursor);
    cursor += profundidades[l] + larguraRua;
  }

  const salas: Sala[] = [];
  /** Indice em `salas` por posicao da malha; null onde virou praca. */
  const grade: Array<Array<number | null>> = [];

  for (let l = 0; l < linhas; l++) {
    const linha: Array<number | null> = [];
    for (let c = 0; c < colunas; c++) {
      // Lacunas viram pracas: uma malha 100% preenchida parece artificial.
      if (rng.proximo() > 0.18) {
        linha.push(salas.length);
        salas.push({
          id: `quarteirao-${salas.length}`,
          x: xDaColuna[c],
          z: zDaLinha[l],
          largura: larguras[c],
          profundidade: profundidades[l],
          altura: rng.inteiro(5, 14),
          papel: 'comum',
        });
      } else {
        linha.push(null);
      }
    }
    grade.push(linha);
  }

  const corredores: Corredor[] = [];
  const ligar = (a: number, b: number) => {
    const sa = salas[a];
    const sb = salas[b];
    corredores.push(
      corredorEmL(sa.id, sb.id, centro(sa as Retangulo), centro(sb as Retangulo), larguraRua, true),
    );
  };

  // Ruas horizontais: cada quarteirao liga ao PROXIMO EXISTENTE da sua linha.
  // Pular a lacuna mantem a rua reta atravessando a praca, que e exatamente o
  // que uma rua faz.
  for (let l = 0; l < linhas; l++) {
    let anterior: number | null = null;
    for (let c = 0; c < colunas; c++) {
      const atual = grade[l][c];
      if (atual === null) continue;
      if (anterior !== null) ligar(anterior, atual);
      anterior = atual;
    }
  }

  // Ruas verticais: mesma logica por coluna.
  for (let c = 0; c < colunas; c++) {
    let anterior: number | null = null;
    for (let l = 0; l < linhas; l++) {
      const atual = grade[l][c];
      if (atual === null) continue;
      if (anterior !== null) ligar(anterior, atual);
      anterior = atual;
    }
  }

  garantirConexo(salas, corredores, larguraRua);
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
  // Clareiras espalhadas por dispersao radial, ligadas por trilhas.
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

  // Arvore geradora minima por vizinho mais proximo (Prim).
  //
  // Encadear por ordem de criacao ligava clareiras consecutivas que a dispersao
  // radial pode ter jogado em lados opostos — a trilha cruzava o mapa inteiro,
  // passando por cima das clareiras do meio. Ligar sempre a clareira ja
  // conectada MAIS PROXIMA mantem cada trilha curta, que e o que evita o
  // cruzamento e tambem o que parece natural no terreno.
  const corredores: Corredor[] = [];
  if (salas.length > 1) {
    const conectadas = [0];
    const pendentes = salas.map((_, i) => i).slice(1);

    while (pendentes.length > 0) {
      let melhorDist = Number.POSITIVE_INFINITY;
      let melhorConectada = 0;
      let melhorPendenteIdx = 0;

      for (const a of conectadas) {
        const ca = centro(salas[a] as Retangulo);
        for (let k = 0; k < pendentes.length; k++) {
          const cb = centro(salas[pendentes[k]] as Retangulo);
          const dist = Math.hypot(ca.x - cb.x, ca.z - cb.z);
          if (dist < melhorDist) {
            melhorDist = dist;
            melhorConectada = a;
            melhorPendenteIdx = k;
          }
        }
      }

      const b = pendentes.splice(melhorPendenteIdx, 1)[0];
      corredores.push(
        corredorEmL(
          salas[melhorConectada].id,
          salas[b].id,
          centro(salas[melhorConectada] as Retangulo),
          centro(salas[b] as Retangulo),
          rng.inteiro(3, 5),
          rng.proximo() < 0.5,
        ),
      );
      conectadas.push(b);
    }
  }

  aplicarPapeisNarrativos(rng, salas, segredos, monstros);

  return { seed, nome, tipo, arquetipo: 'natural', salas, corredores, limites: calcularLimites(salas) };
}

/**
 * Rede de seguranca: liga componentes soltos ao resto.
 *
 * A malha urbana com pracas pode, em sorteios raros, isolar um quarteirao (uma
 * coluna vazia partindo o mapa em dois, por exemplo). Uma cidade com um bloco
 * inalcancavel e um defeito silencioso, entao o grafo e verificado e costurado
 * pelo par mais proximo entre componentes.
 */
function garantirConexo(salas: Sala[], corredores: Corredor[], largura: number): void {
  if (salas.length < 2) return;

  const indicePorId = new Map(salas.map((s, i) => [s.id, i]));
  const vizinhos: number[][] = salas.map(() => []);
  for (const c of corredores) {
    const a = indicePorId.get(c.deSalaId);
    const b = indicePorId.get(c.paraSalaId);
    if (a === undefined || b === undefined) continue;
    vizinhos[a].push(b);
    vizinhos[b].push(a);
  }

  const componente = new Array<number>(salas.length).fill(-1);
  let total = 0;
  for (let i = 0; i < salas.length; i++) {
    if (componente[i] !== -1) continue;
    const fila = [i];
    componente[i] = total;
    while (fila.length > 0) {
      const atual = fila.pop() as number;
      for (const v of vizinhos[atual]) {
        if (componente[v] === -1) {
          componente[v] = total;
          fila.push(v);
        }
      }
    }
    total++;
  }
  if (total <= 1) return;

  // Funde componente a componente pelo par de salas mais proximo.
  for (let alvo = 1; alvo < total; alvo++) {
    let melhorDist = Number.POSITIVE_INFINITY;
    let de = -1;
    let para = -1;
    for (let i = 0; i < salas.length; i++) {
      if (componente[i] !== 0) continue;
      const ci = centro(salas[i] as Retangulo);
      for (let j = 0; j < salas.length; j++) {
        if (componente[j] !== alvo) continue;
        const cj = centro(salas[j] as Retangulo);
        const dist = Math.hypot(ci.x - cj.x, ci.z - cj.z);
        if (dist < melhorDist) {
          melhorDist = dist;
          de = i;
          para = j;
        }
      }
    }
    if (de === -1 || para === -1) continue;

    corredores.push(
      corredorEmL(
        salas[de].id,
        salas[para].id,
        centro(salas[de] as Retangulo),
        centro(salas[para] as Retangulo),
        largura,
        true,
      ),
    );
    for (let i = 0; i < salas.length; i++) if (componente[i] === alvo) componente[i] = 0;
  }
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
