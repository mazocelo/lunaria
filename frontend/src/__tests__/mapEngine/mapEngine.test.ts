import { describe, it, expect } from 'vitest';
import { gerarMapa, derivarSeed, normalizarTipo, type LocalRoteiro, type MapaLayout } from '../../mapEngine';
import { criarRng, hashSeed } from '../../mapEngine/rng';
import { colidem } from '../../mapEngine/geometria';

// Local real extraido do roteiro da historia 1 em producao.
const CATACUMBAS: LocalRoteiro = {
  nome: 'Catacumbas de Aethelburg',
  tipo: 'dungeon',
  descricao: 'Labirinto subterraneo sob a Academia.',
  segredos: [
    'Diario de Elara detalhando sua corrupcao inicial',
    'Mapa astral mostrando localizacao dos Fragmentos',
    'Portal menor ainda ativo para plano demoniaco',
  ],
  monstros_comuns: ['Dretch', 'Lemure', 'Manes', 'Esqueleto', 'Ghoul', 'Imp'],
};

// Historia 3 em producao tem exatamente este local degenerado.
const DEGENERADO: LocalRoteiro = {
  nome: 'Local Central',
  tipo: 'outro',
  descricao: 'Sem descricao',
  segredos: ['Nenhum segredo definido'],
  monstros_comuns: ['Nenhum'],
};

describe('rng deterministico', () => {
  it('mesma seed produz a mesma sequencia', () => {
    const a = criarRng(12345);
    const b = criarRng(12345);
    const seqA = Array.from({ length: 20 }, () => a.proximo());
    const seqB = Array.from({ length: 20 }, () => b.proximo());
    expect(seqA).toEqual(seqB);
  });

  it('seeds diferentes divergem', () => {
    const a = criarRng(1);
    const b = criarRng(2);
    expect(a.proximo()).not.toBe(b.proximo());
  });

  it('hashSeed e estavel e sensivel ao conteudo', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'));
  });

  it('embaralhar nao muta a entrada', () => {
    const original = [1, 2, 3, 4, 5];
    const copia = [...original];
    criarRng(7).embaralhar(original);
    expect(original).toEqual(copia);
  });
});

describe('normalizarTipo', () => {
  it('aceita os tipos reais do banco', () => {
    for (const t of ['dungeon', 'ruina', 'templo', 'caverna', 'fortaleza', 'cidade', 'floresta', 'outro']) {
      expect(normalizarTipo(t)).toBe(t);
    }
  });

  it('tolera caixa e acento do LLM', () => {
    expect(normalizarTipo('Dungeon')).toBe('dungeon');
    expect(normalizarTipo('  RUÍNA ')).toBe('ruina');
  });

  it('desconhecido e ausente viram outro', () => {
    expect(normalizarTipo('nave-espacial')).toBe('outro');
    expect(normalizarTipo(undefined)).toBe('outro');
  });
});

describe('determinismo do mapa (jogadores veem a mesma planta)', () => {
  it('duas geracoes da mesma entrada sao identicas', () => {
    const a = gerarMapa(1, CATACUMBAS);
    const b = gerarMapa(1, CATACUMBAS);
    expect(a).toEqual(b);
  });

  it('historias diferentes geram plantas diferentes para o mesmo local', () => {
    const a = gerarMapa(1, CATACUMBAS);
    const b = gerarMapa(2, CATACUMBAS);
    expect(a.seed).not.toBe(b.seed);
    expect(a.salas).not.toEqual(b.salas);
  });

  it('a seed depende de historia, nome e tipo', () => {
    const base = derivarSeed(1, CATACUMBAS);
    expect(derivarSeed(1, { ...CATACUMBAS, nome: 'Outro' })).not.toBe(base);
    expect(derivarSeed(1, { ...CATACUMBAS, tipo: 'templo' })).not.toBe(base);
    expect(derivarSeed(1, CATACUMBAS)).toBe(base);
  });
});

describe('invariantes geometricas', () => {
  const casos: Array<[string, MapaLayout]> = [
    ['dungeon', gerarMapa(1, CATACUMBAS)],
    ['templo', gerarMapa(1, { ...CATACUMBAS, tipo: 'templo' })],
    ['caverna', gerarMapa(1, { ...CATACUMBAS, tipo: 'caverna' })],
    ['ruina', gerarMapa(1, { ...CATACUMBAS, tipo: 'ruina' })],
    ['fortaleza', gerarMapa(1, { ...CATACUMBAS, tipo: 'fortaleza' })],
    ['cidade', gerarMapa(1, { ...CATACUMBAS, tipo: 'cidade' })],
    ['floresta', gerarMapa(1, { ...CATACUMBAS, tipo: 'floresta' })],
    ['degenerado', gerarMapa(3, DEGENERADO)],
  ];

  it.each(casos)('%s: gera ao menos uma sala com dimensoes positivas', (_nome, layout) => {
    expect(layout.salas.length).toBeGreaterThan(0);
    for (const s of layout.salas) {
      expect(s.largura).toBeGreaterThan(0);
      expect(s.profundidade).toBeGreaterThan(0);
      expect(Number.isFinite(s.x)).toBe(true);
      expect(Number.isFinite(s.z)).toBe(true);
    }
  });

  it.each(casos)('%s: salas nao se sobrepoem', (_nome, layout) => {
    for (let i = 0; i < layout.salas.length; i++) {
      for (let j = i + 1; j < layout.salas.length; j++) {
        // margem 0: sobreposicao real de area, nao apenas proximidade.
        expect(colidem(layout.salas[i], layout.salas[j], 0)).toBe(false);
      }
    }
  });

  it.each(casos)('%s: ids sao unicos', (_nome, layout) => {
    const ids = layout.salas.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(casos)('%s: corredores referenciam salas existentes', (_nome, layout) => {
    const ids = new Set(layout.salas.map((s) => s.id));
    for (const c of layout.corredores) {
      expect(ids.has(c.deSalaId)).toBe(true);
      expect(ids.has(c.paraSalaId)).toBe(true);
      expect(c.pontos.length).toBeGreaterThanOrEqual(2);
    }
  });

  it.each(casos)('%s: limites contem todas as salas', (_nome, layout) => {
    for (const s of layout.salas) {
      expect(s.x).toBeGreaterThanOrEqual(layout.limites.minX);
      expect(s.z).toBeGreaterThanOrEqual(layout.limites.minZ);
      expect(s.x + s.largura).toBeLessThanOrEqual(layout.limites.maxX);
      expect(s.z + s.profundidade).toBeLessThanOrEqual(layout.limites.maxZ);
    }
  });

  /**
   * Um corredor so pode tocar as duas salas que ele liga. Atravessar uma
   * terceira significa rua passando por dentro de predio, ou trilha por cima de
   * clareira.
   *
   * O caso que motivou este teste: urbano e natural encadeavam as celulas por
   * ORDEM DE CRIACAO, entao o ultimo quarteirao de uma fileira virava "vizinho"
   * do primeiro da fileira seguinte e a rua cortava o mapa na diagonal. Uma
   * cidade de 16 quarteiroes chegava a 10 travessias.
   */
  it.each(casos)('%s: corredores nao atravessam salas alheias', (_nome, layout) => {
    for (const c of layout.corredores) {
      for (let i = 1; i < c.pontos.length; i++) {
        const a = c.pontos[i - 1];
        const b = c.pontos[i];
        const minX = Math.min(a.x, b.x) - c.largura / 2;
        const maxX = Math.max(a.x, b.x) + c.largura / 2;
        const minZ = Math.min(a.z, b.z) - c.largura / 2;
        const maxZ = Math.max(a.z, b.z) + c.largura / 2;

        for (const s of layout.salas) {
          if (s.id === c.deSalaId || s.id === c.paraSalaId) continue;
          const cruza =
            minX < s.x + s.largura && maxX > s.x && minZ < s.z + s.profundidade && maxZ > s.z;
          expect(cruza, `${c.deSalaId}->${c.paraSalaId} atravessa ${s.id}`).toBe(false);
        }
      }
    }
  });

  it.each(casos)('%s: todas as salas sao alcancaveis (grafo sem ilhas)', (_nome, layout) => {
    if (layout.salas.length < 2) return;
    const vizinhos = new Map<string, string[]>();
    for (const s of layout.salas) vizinhos.set(s.id, []);
    for (const c of layout.corredores) {
      vizinhos.get(c.deSalaId)?.push(c.paraSalaId);
      vizinhos.get(c.paraSalaId)?.push(c.deSalaId);
    }
    const visitados = new Set<string>();
    const fila = [layout.salas[0].id];
    while (fila.length) {
      const atual = fila.pop() as string;
      if (visitados.has(atual)) continue;
      visitados.add(atual);
      for (const v of vizinhos.get(atual) ?? []) if (!visitados.has(v)) fila.push(v);
    }
    expect(visitados.size).toBe(layout.salas.length);
  });

  it('interiores conectam todas as salas (grafo sem ilhas)', () => {
    const layout = gerarMapa(1, CATACUMBAS);
    const vizinhos = new Map<string, string[]>();
    for (const s of layout.salas) vizinhos.set(s.id, []);
    for (const c of layout.corredores) {
      vizinhos.get(c.deSalaId)?.push(c.paraSalaId);
      vizinhos.get(c.paraSalaId)?.push(c.deSalaId);
    }
    const visitados = new Set<string>();
    const fila = [layout.salas[0].id];
    while (fila.length) {
      const atual = fila.pop() as string;
      if (visitados.has(atual)) continue;
      visitados.add(atual);
      for (const v of vizinhos.get(atual) ?? []) if (!visitados.has(v)) fila.push(v);
    }
    expect(visitados.size).toBe(layout.salas.length);
  });
});

describe('conteudo narrativo vira geometria', () => {
  it('segredos do roteiro viram salas secretas rotuladas', () => {
    const layout = gerarMapa(1, CATACUMBAS);
    const secretas = layout.salas.filter((s) => s.papel === 'segredo');
    expect(secretas.length).toBeGreaterThan(0);
    expect(secretas.map((s) => s.rotulo)).toContain('Diario de Elara detalhando sua corrupcao inicial');
  });

  it('monstros do roteiro viram salas de encontro', () => {
    const layout = gerarMapa(1, CATACUMBAS);
    const encontros = layout.salas.filter((s) => s.papel === 'encontro');
    expect(encontros.length).toBeGreaterThan(0);
    expect(encontros.every((s) => (s.rotulo?.length ?? 0) > 0)).toBe(true);
  });

  it('sempre existe uma entrada', () => {
    for (const historiaId of [1, 2, 3]) {
      const layout = gerarMapa(historiaId, CATACUMBAS);
      expect(layout.salas.filter((s) => s.papel === 'entrada')).toHaveLength(1);
    }
  });

  it('local rico gera mais salas que local vazio do mesmo tipo', () => {
    const rico = gerarMapa(1, { ...CATACUMBAS, tipo: 'dungeon' });
    const vazio = gerarMapa(1, { nome: 'Catacumbas de Aethelburg', tipo: 'dungeon' });
    expect(rico.salas.length).toBeGreaterThan(vazio.salas.length);
  });

  it('placeholders do roteiro nao viram salas rotuladas', () => {
    const layout = gerarMapa(3, DEGENERADO);
    const rotulos = layout.salas.map((s) => s.rotulo).filter(Boolean);
    expect(rotulos).not.toContain('Nenhum segredo definido');
    expect(rotulos).not.toContain('Nenhum');
    expect(layout.salas.filter((s) => s.papel === 'segredo')).toHaveLength(0);
  });

  it('local minimo (so nome) ainda produz mapa valido', () => {
    const layout = gerarMapa(99, { nome: 'X' });
    expect(layout.salas.length).toBeGreaterThan(0);
    expect(layout.arquetipo).toBe('interior');
  });
});

describe('arquetipo por tipo', () => {
  it('cidade e urbano, floresta e natural, resto e interior', () => {
    expect(gerarMapa(1, { nome: 'A', tipo: 'cidade' }).arquetipo).toBe('urbano');
    expect(gerarMapa(1, { nome: 'A', tipo: 'floresta' }).arquetipo).toBe('natural');
    for (const t of ['dungeon', 'ruina', 'templo', 'caverna', 'fortaleza', 'outro']) {
      expect(gerarMapa(1, { nome: 'A', tipo: t }).arquetipo).toBe('interior');
    }
  });

  it('clareiras da floresta sao abertas (sem paredes)', () => {
    const layout = gerarMapa(1, { nome: 'Mata', tipo: 'floresta' });
    expect(layout.salas.every((s) => s.altura === 0)).toBe(true);
  });
});
