import { describe, it, expect } from 'vitest';
import {
  historiaSchema,
  historiaListSchema,
  ROTEIRO_STATUS_CONHECIDOS,
  ROTEIRO_STATUS_EM_PROGRESSO,
} from '../../types/api/historia';
import { racaSchema } from '../../types/api/raca';

// Regressao: o enum antigo de `roteiro_status` listava 'ready' (valor que o
// backend nunca gravou) e recusava 'completed' (o que ele grava de fato em
// roteiroGenerationService/historiaController). Como parseRaw e fail-loud e a
// lista usa historiaListSchema, uma unica historia pronta derrubava TODA a
// listagem: "Erro ao buscar historias: [contract:HistoriaService.getAll]".
describe('historiaSchema — roteiro_status', () => {
  const historia = {
    id: 1,
    nome: 'A Torre',
    temas: [],
    sistema: 'lunaria',
  };

  it('aceita os status que o backend realmente grava', () => {
    for (const status of ROTEIRO_STATUS_CONHECIDOS) {
      const r = historiaSchema.safeParse({ ...historia, roteiro_status: status });
      expect(r.success, `status ${status} deveria ser aceito`).toBe(true);
    }
  });

  it('aceita completed em listagem (caso que quebrava a tela de historias)', () => {
    const lista = historiaListSchema.parse([
      { ...historia, roteiro_status: 'completed' },
      { ...historia, id: 2, roteiro_status: 'error' },
    ]);
    expect(lista).toHaveLength(2);
    expect(lista[0].roteiro_status).toBe('completed');
  });

  it('nao derruba o parse com status novo/desconhecido do backend', () => {
    const r = historiaSchema.safeParse({ ...historia, roteiro_status: 'paused' });
    expect(r.success).toBe(true);
  });

  it('aceita roteiro_status null e ausente', () => {
    expect(historiaSchema.safeParse({ ...historia, roteiro_status: null }).success).toBe(true);
    expect(historiaSchema.safeParse(historia).success).toBe(true);
  });

  it('os status de polling fazem parte do vocabulario conhecido', () => {
    for (const status of ROTEIRO_STATUS_EM_PROGRESSO) {
      expect(ROTEIRO_STATUS_CONHECIDOS).toContain(status);
    }
  });
});

// Regressao: `daemon` e valor valido do enum `Sistema` no Postgres, mas estava
// fora da union do frontend. A primeira entidade daemon derrubaria as sete
// listagens que compartilham sistemaSchema.
describe('sistemaSchema — cobre o enum do banco', () => {
  it('aceita daemon em historia e em catalogo', () => {
    expect(historiaSchema.safeParse({ ...{ id: 1, nome: 'X', temas: [] }, sistema: 'daemon' }).success).toBe(true);
    const raca = { id: 1, nome: 'Daemon', custo: 0, sistema: 'daemon' };
    expect(racaSchema.safeParse(raca).success).toBe(true);
  });

  it('segue recusando valor fora do enum do banco', () => {
    expect(historiaSchema.safeParse({ id: 1, nome: 'X', temas: [], sistema: 'foo' }).success).toBe(false);
  });
});
