import { calcularLimites, centro, corredorEmL, posicionarAdjacente, type Retangulo } from '../geometria';
import type { Rng } from '../rng';
import type { Corredor, MapaLayout, PapelSala, Sala, TipoLocal } from '../types';

/**
 * Arquetipo INTERIOR: grafo de salas ligadas por corredores.
 *
 * Cobre dungeon/ruina/templo/caverna/fortaleza/outro — 29 dos 33 locais que
 * existem hoje no banco. O que muda entre eles e proporcao, altura e densidade,
 * nao a estrategia: por isso um gerador so, parametrizado.
 */

interface PerfilInterior {
  /** Faixa de lado das salas, em metros. */
  lado: [number, number];
  altura: number;
  /** Quantidade base de salas antes dos ajustes por segredos/monstros. */
  salasBase: [number, number];
  larguraCorredor: number;
  /** Folga entre salas; valores altos dao plantas mais espalhadas. */
  espacamento: [number, number];
}

const PERFIS: Record<string, PerfilInterior> = {
  dungeon: { lado: [6, 12], altura: 4, salasBase: [6, 9], larguraCorredor: 3, espacamento: [4, 7] },
  // Ruina: comodos irregulares, teto baixo (desabado) e planta esparsa.
  ruina: { lado: [5, 14], altura: 3.5, salasBase: [5, 8], larguraCorredor: 4, espacamento: [6, 11] },
  // Templo: poucas salas, mas monumentais e de pe direito alto.
  templo: { lado: [9, 17], altura: 9, salasBase: [4, 6], larguraCorredor: 5, espacamento: [5, 8] },
  caverna: { lado: [5, 11], altura: 4.5, salasBase: [6, 10], larguraCorredor: 3, espacamento: [3, 6] },
  fortaleza: { lado: [7, 13], altura: 6, salasBase: [6, 9], larguraCorredor: 4, espacamento: [4, 6] },
  outro: { lado: [6, 12], altura: 4, salasBase: [5, 8], larguraCorredor: 3, espacamento: [4, 7] },
};

export function gerarInterior(
  rng: Rng,
  seed: number,
  nome: string,
  tipo: TipoLocal,
  segredos: string[],
  monstros: string[],
): MapaLayout {
  const perfil = PERFIS[tipo] ?? PERFIS.outro;

  // O conteudo narrativo dimensiona o mapa: cada segredo vira uma sala oculta e
  // a variedade de monstros aumenta o numero de salas de encontro. Um local rico
  // no roteiro gera uma planta maior que um local vazio.
  const salasSegredo = Math.min(segredos.length, 4);
  const salasEncontro = Math.min(monstros.length > 0 ? Math.ceil(monstros.length / 2) : 0, 4);
  const alvo = rng.inteiro(perfil.salasBase[0], perfil.salasBase[1]) + salasSegredo + salasEncontro;

  const retangulos: Retangulo[] = [];
  const primeiro: Retangulo = {
    x: 0,
    z: 0,
    largura: rng.inteiro(perfil.lado[0], perfil.lado[1]),
    profundidade: rng.inteiro(perfil.lado[0], perfil.lado[1]),
  };
  retangulos.push(primeiro);

  const corredores: Corredor[] = [];

  for (let i = 1; i < alvo; i++) {
    const dimensoes = {
      largura: rng.inteiro(perfil.lado[0], perfil.lado[1]),
      profundidade: rng.inteiro(perfil.lado[0], perfil.lado[1]),
    };

    // Ancora preferencial e a sala anterior (gera progressao em cadeia). Se nao
    // couber, tenta salas ja colocadas em ordem aleatoria — isso cria
    // ramificacoes em vez de um corredor unico e reto.
    const ancoras = [retangulos[retangulos.length - 1], ...rng.embaralhar(retangulos.slice(0, -1))];

    let colocada = false;
    for (const ancora of ancoras) {
      const pos = posicionarAdjacente(rng, ancora, dimensoes, retangulos, 2, perfil.espacamento);
      if (!pos) continue;

      const indiceAncora = retangulos.indexOf(ancora);
      retangulos.push(pos);
      corredores.push(
        corredorEmL(
          `sala-${indiceAncora}`,
          `sala-${retangulos.length - 1}`,
          centro(ancora),
          centro(pos),
          perfil.larguraCorredor,
          rng.proximo() < 0.5,
        ),
      );
      colocada = true;
      break;
    }
    // Sem vaga em nenhuma ancora: para de crescer em vez de entrar em loop.
    if (!colocada) break;
  }

  const salas = atribuirPapeis(rng, retangulos, perfil.altura, segredos, monstros);

  return {
    seed,
    nome,
    tipo,
    arquetipo: 'interior',
    salas,
    corredores,
    limites: calcularLimites(salas),
  };
}

/**
 * Distribui papeis narrativos. Entrada e final ficam nas pontas da cadeia (a
 * primeira e a ultima colocadas), o que aproxima uma progressao real; segredos
 * e encontros preenchem o miolo em posicoes sorteadas mas deterministicas.
 */
function atribuirPapeis(
  rng: Rng,
  retangulos: Retangulo[],
  altura: number,
  segredos: string[],
  monstros: string[],
): Sala[] {
  const papeis: PapelSala[] = retangulos.map(() => 'comum');
  const rotulos: Array<string | undefined> = retangulos.map(() => undefined);

  papeis[0] = 'entrada';
  if (retangulos.length > 1) papeis[retangulos.length - 1] = 'final';

  const miolo = rng.embaralhar(
    retangulos.map((_, i) => i).filter((i) => papeis[i] === 'comum'),
  );

  let cursor = 0;
  for (const segredo of segredos.slice(0, 4)) {
    if (cursor >= miolo.length) break;
    const idx = miolo[cursor++];
    papeis[idx] = 'segredo';
    rotulos[idx] = segredo;
  }
  // Agrupa monstros de dois em dois para dar nome a cada sala de encontro.
  for (let i = 0; i < monstros.length && cursor < miolo.length; i += 2) {
    const idx = miolo[cursor++];
    papeis[idx] = 'encontro';
    rotulos[idx] = monstros.slice(i, i + 2).join(', ');
  }

  return retangulos.map((r, i) => ({
    id: `sala-${i}`,
    x: r.x,
    z: r.z,
    largura: r.largura,
    profundidade: r.profundidade,
    // Salas de destaque ganham pe direito maior, criando silhueta no 3D.
    altura: papeis[i] === 'final' || papeis[i] === 'entrada' ? altura * 1.35 : altura,
    papel: papeis[i],
    rotulo: rotulos[i],
  }));
}
