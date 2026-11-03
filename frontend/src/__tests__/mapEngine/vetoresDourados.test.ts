import { describe, it, expect } from 'vitest';
import vetores from './vetoresDourados.json';
import { gerarMapa } from '../../mapEngine';
import { CASOS_DOURADOS } from './casosDourados';

/**
 * Vetores dourados: travam a SAIDA do motor contra um snapshot versionado.
 *
 * Os outros testes verificam propriedades (determinismo dentro do mesmo
 * processo, salas nao se sobrepoem, grafo conectado). Nenhum deles fixa um
 * VALOR — entao um refator podia repintar todas as plantas do jogo em silencio
 * e a suite continuaria verde.
 *
 * Isso importa mais aqui do que num gerador comum: a planta e derivada no
 * cliente a partir de (historiaId, local), sem persistencia. Se a saida mudar,
 * o mapa que o jogador viu ontem deixa de existir — nao ha migracao possivel,
 * porque nao ha dado gravado.
 *
 * SE ESTE TESTE FALHAR: nao atualize o JSON por reflexo. Ou a mudanca foi
 * acidental (conserte o codigo), ou foi deliberada — e ai o diff do JSON e
 * exatamente o inventario do que vai repintar em producao. Regenere so depois
 * de olhar esse diff.
 */
const snapshot = vetores as Record<string, unknown>;

describe('vetores dourados do motor de mapas', () => {
  it('a lista de casos e o snapshot cobrem os mesmos ids', () => {
    expect(CASOS_DOURADOS.map((c) => c.id).sort()).toEqual(Object.keys(snapshot).sort());
  });

  it.each(CASOS_DOURADOS.map((c) => [c.id, c] as const))(
    '%s gera exatamente o layout congelado',
    (id, caso) => {
      expect(gerarMapa(caso.historiaId, caso.local)).toEqual(snapshot[id]);
    },
  );

  // Regressao especifica: a seed sai de (historiaId, nome, tipo), mas o numero
  // de salas depende tambem de segredos[] e monstros_comuns[]
  // (archetypes/interior.ts). Ou seja, a seed NAO identifica a planta — quem
  // quiser reproduzir um mapa precisa da entrada inteira, nao so do id do local.
  it('mesma seed com conteudo diferente produz plantas diferentes', () => {
    const rico = gerarMapa(1, CASOS_DOURADOS.find((c) => c.id === 'dungeon-rico')!.local);
    const vazio = gerarMapa(1, CASOS_DOURADOS.find((c) => c.id === 'dungeon-vazio')!.local);

    expect(rico.seed).toBe(vazio.seed);
    expect(rico.salas.length).not.toBe(vazio.salas.length);
  });
});
