import { Personagem } from '../models/Personagem';
import {
  parseRaw,
  personagemSchema,
  personagemListSchema,
  type Personagem as PersonagemDTO,
  type PersonagemUpdatePayload,
  assertLegacyEnvelope,
  type LegacyEnvelope,
} from '../types/api';
import type { ApiClient } from './ApiClient';

interface GetByHistoriaOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

interface GetByHistoriaResult {
  personagens: Personagem[];
  historia: unknown;
  pagination: LegacyEnvelope<unknown>['pagination'];
  message: string | null;
  total: number;
}

/** `getAll` devolve o envelope legado com `data` ja mapeado para o Model. */
interface GetAllResult extends LegacyEnvelope<unknown> {
  data: Personagem[];
}

/** Endpoint por historia anexa um campo `historia` extra ao envelope legado. */
interface PersonagemHistoriaEnvelope extends LegacyEnvelope<unknown> {
  historia?: unknown;
}

/**
 * Servico para gerenciar operacoes de Personagem.
 * Boundary do contrato API <-> Front: aplica `parseRaw(personagemSchema, ...)`
 * no `data` do envelope legado para garantir que qualquer drift falhe loud
 * antes de chegar no Model/View.
 */
export class PersonagemService {
  private readonly apiClient: ApiClient;
  private readonly baseUrl: string;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.baseUrl = '/personagens';
  }

  /**
   * Busca todos os personagens. Retorna o envelope LEGADO com `data` ja
   * mapeado para instancias do Model — o store consome `response.data` e
   * `response.pagination` diretamente.
   */
  async getAll(): Promise<GetAllResult> {
    try {
      const raw = await this.apiClient.get(this.baseUrl);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.getAll');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const lista: PersonagemDTO[] = parseRaw(
        personagemListSchema,
        env.data,
        'PersonagemService.getAll',
      );
      return {
        ...env,
        data: lista.map((personagemData) => Personagem.fromAPI(personagemData)),
      };
    } catch (error) {
      throw new Error(`Erro ao buscar personagens: ${(error as Error).message}`);
    }
  }

  /**
   * Busca um personagem por ID.
   */
  async getById(id: number): Promise<Personagem> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.getById');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(personagemSchema, env.data, 'PersonagemService.getById');
      return Personagem.fromAPI(dto);
    } catch (error) {
      throw new Error(`Erro ao buscar personagem: ${(error as Error).message}`);
    }
  }

  /**
   * Cria um novo personagem.
   */
  async create(
    personagem: Personagem,
    validationOptions: Record<string, unknown> = {},
  ): Promise<Personagem> {
    try {
      const validation = personagem.validate(validationOptions);
      if (!validation.isValid) {
        throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
      }

      const raw = await this.apiClient.post(this.baseUrl, personagem.toJSON());
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.create');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(personagemSchema, env.data, 'PersonagemService.create');
      return Personagem.fromAPI(dto);
    } catch (error) {
      throw new Error(`Erro ao criar personagem: ${(error as Error).message}`);
    }
  }

  /**
   * Cria um personagem D&D 5e a partir do payload do wizard.
   * O payload D&D nao casa com o modelo Lunaria (ability scores STR/DEX/...,
   * skill proficiencies), entao e enviado direto sem passar pelo toJSON Lunaria.
   */
  async createDnd5e(payload: Record<string, unknown>): Promise<Personagem> {
    try {
      const raw = await this.apiClient.post(this.baseUrl, payload);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.createDnd5e');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(personagemSchema, env.data, 'PersonagemService.createDnd5e');
      return Personagem.fromAPI(dto);
    } catch (error) {
      throw new Error(`Erro ao criar personagem: ${(error as Error).message}`);
    }
  }

  /**
   * Atualiza um personagem existente. Aceita uma instancia do Model
   * (que sera validada e convertida via `toUpdatePayload()`) ou um payload
   * plano com os campos editaveis.
   */
  async update(
    id: number,
    personagemData: Personagem | PersonagemUpdatePayload,
  ): Promise<Personagem> {
    try {
      // Se for uma instancia de Personagem, validar e converter.
      // O PUT nao altera atributos: enviar so os campos editaveis (toUpdatePayload),
      // nunca os escalares de atributo nem o mapa `atributos`.
      let dadosEnvio: Record<string, unknown>;
      if (personagemData instanceof Personagem) {
        const validation = personagemData.validate();
        if (!validation.isValid) {
          throw new Error(`Dados inválidos: ${validation.errors.join(', ')}`);
        }
        dadosEnvio = personagemData.toUpdatePayload() as Record<string, unknown>;
      } else {
        dadosEnvio = personagemData as Record<string, unknown>;
      }

      const raw = await this.apiClient.put(`${this.baseUrl}/${id}`, dadosEnvio);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.update');
      if (!env.success) {
        throw new Error(env.message || 'Erro desconhecido');
      }
      const dto = parseRaw(personagemSchema, env.data, 'PersonagemService.update');
      return Personagem.fromAPI(dto);
    } catch (error) {
      throw new Error(`Erro ao atualizar personagem: ${(error as Error).message}`);
    }
  }

  /**
   * Remove um personagem (backend retorna 204 No Content).
   */
  async delete(id: number): Promise<null> {
    try {
      await this.apiClient.delete(`${this.baseUrl}/${id}`);
      return null;
    } catch (error) {
      throw new Error(`Erro ao remover personagem: ${(error as Error).message}`);
    }
  }

  /**
   * Busca personagens por historia. Retorna estrutura customizada com
   * personagens, historia, paginacao e mensagem.
   */
  async getByHistoria(historiaId: number, options: GetByHistoriaOptions = {}): Promise<GetByHistoriaResult> {
    try {
      const queryParams = new URLSearchParams();

      if (options.search) queryParams.append('search', options.search);
      if (options.limit != null) queryParams.append('limit', String(options.limit));
      if (options.offset != null) queryParams.append('offset', String(options.offset));

      const url = `${this.baseUrl}/historia/${historiaId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const raw = await this.apiClient.get(url);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.getByHistoria') as PersonagemHistoriaEnvelope;
      if (!env.success) {
        throw new Error(env.message || env.error || 'Erro desconhecido');
      }
      const lista = parseRaw(personagemListSchema, env.data, 'PersonagemService.getByHistoria');
      const total = env.pagination?.total ?? lista.length;
      return {
        personagens: lista.map((personagemData) => Personagem.fromAPI(personagemData)),
        historia: env.historia ?? null,
        pagination: env.pagination ?? null,
        message: env.message ?? null,
        total,
      };
    } catch (error) {
      throw new Error(`Erro ao buscar personagens por história: ${(error as Error).message}`);
    }
  }

  /**
   * Busca personagens por usuario e historia. Hoje delega para o mesmo
   * endpoint de getByHistoria (filtro de usuario fica implicito no backend).
   */
  async getByUsuarioEHistoria(
    _usuarioId: number,
    historiaId: number,
    options: GetByHistoriaOptions = {},
  ): Promise<GetByHistoriaResult> {
    try {
      const queryParams = new URLSearchParams();

      if (options.search) queryParams.append('search', options.search);
      if (options.limit != null) queryParams.append('limit', String(options.limit));
      if (options.offset != null) queryParams.append('offset', String(options.offset));

      const url = `${this.baseUrl}/historia/${historiaId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const raw = await this.apiClient.get(url);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.getByUsuarioEHistoria') as PersonagemHistoriaEnvelope;
      if (!env.success) {
        throw new Error(env.message || env.error || 'Erro desconhecido');
      }
      const lista = parseRaw(personagemListSchema, env.data, 'PersonagemService.getByUsuarioEHistoria');
      const total = env.pagination?.total ?? lista.length;
      return {
        personagens: lista.map((personagemData) => Personagem.fromAPI(personagemData)),
        historia: env.historia ?? null,
        pagination: env.pagination ?? null,
        message: env.message ?? null,
        total,
      };
    } catch (error) {
      throw new Error(`Erro ao buscar personagens por usuário e história: ${(error as Error).message}`);
    }
  }

  /**
   * Gera background via IA com todos os dados da ficha.
   * Payload retornado pelo backend ainda nao tem schema dedicado (Fase 3),
   * por isso sai como `unknown`.
   */
  async gerarBackground(id: number, sugestao = ''): Promise<unknown> {
    try {
      const raw = await this.apiClient.post(`${this.baseUrl}/${id}/background`, {
        sugestao_background: sugestao,
      });
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.gerarBackground');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao gerar background');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao gerar background: ${(error as Error).message}`);
    }
  }

  /**
   * Valida coerencia narrativa do personagem via IA.
   */
  async validarCoerencia(id: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.post(`${this.baseUrl}/${id}/validar-coerencia`);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.validarCoerencia');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao validar coerência');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao validar coerência: ${(error as Error).message}`);
    }
  }

  /**
   * Obtem dados de evolucao do personagem (XP, pontos pendentes, etc.).
   */
  async obterEvolucao(id: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}/evolucao`);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.obterEvolucao');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao obter evolução');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao obter evolução: ${(error as Error).message}`);
    }
  }

  /**
   * Concede XP ao personagem.
   */
  async ganharXP(id: number, quantidade: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.post(`${this.baseUrl}/${id}/ganhar-xp`, { xp: quantidade });
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.ganharXP');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao conceder XP');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao conceder XP: ${(error as Error).message}`);
    }
  }

  /**
   * Distribui pontos de atributo pendentes (ex.: { forca: 1, destreza: 2 }).
   */
  async distribuirPontos(id: number, atributos: Record<string, number>): Promise<unknown> {
    try {
      const raw = await this.apiClient.post(`${this.baseUrl}/${id}/distribuir-pontos`, atributos);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.distribuirPontos');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao distribuir pontos');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao distribuir pontos: ${(error as Error).message}`);
    }
  }

  /**
   * Lista equipamentos do personagem.
   */
  async listarEquipamentos(id: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.get(`${this.baseUrl}/${id}/equipamentos`);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.listarEquipamentos');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao listar equipamentos');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao listar equipamentos: ${(error as Error).message}`);
    }
  }

  /**
   * Adiciona equipamento ao inventario do personagem.
   */
  async adicionarEquipamento(personagemId: number, equipamentoId: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.post(`${this.baseUrl}/${personagemId}/equipamentos`, {
        equipamento_id: equipamentoId,
      });
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.adicionarEquipamento');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao adicionar equipamento');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao adicionar equipamento: ${(error as Error).message}`);
    }
  }

  /**
   * Remove equipamento do inventario do personagem.
   */
  async removerEquipamento(personagemId: number, equipamentoId: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${personagemId}/equipamentos/${equipamentoId}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.removerEquipamento');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao remover equipamento');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao remover equipamento: ${(error as Error).message}`);
    }
  }

  async vincularHistoria(personagemId: number, historiaId: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.post(`${this.baseUrl}/${personagemId}/historias`, {
        historia_id: historiaId,
      });
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.vincularHistoria');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao vincular historia');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao vincular historia: ${(error as Error).message}`);
    }
  }

  /**
   * Gera finalizacao inicial do personagem (combo sugerido + catalogo editavel).
   */
  async gerarFinalizacaoInicial(id: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.post(`${this.baseUrl}/${id}/finalizacao-inicial`);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.gerarFinalizacaoInicial');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao gerar finalizacao inicial');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao gerar finalizacao inicial: ${(error as Error).message}`);
    }
  }

  /**
   * Gera preview da resolutiva final do wizard antes da criacao do personagem.
   */
  async gerarFinalizacaoPreview(
    draft: unknown,
    tentativa = 0,
    comboAnterior: unknown = [],
  ): Promise<unknown> {
    try {
      const raw = await this.apiClient.post(`${this.baseUrl}/finalizacao-preview`, {
        draft,
        tentativa,
        combo_anterior: comboAnterior,
      });
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.gerarFinalizacaoPreview');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao gerar preview da finalizacao');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao gerar preview da finalizacao: ${(error as Error).message}`);
    }
  }

  /**
   * Regenera combo de equipamentos da finalizacao (max 3 tentativas).
   */
  async regenerarEquipamentosFinalizacao(
    id: number,
    tentativa: number,
    equipamentosAnteriores: string[],
  ): Promise<unknown> {
    try {
      const raw = await this.apiClient.post(
        `${this.baseUrl}/${id}/regenerar-equipamentos-finalizacao`,
        { tentativa, equipamentos_anteriores: equipamentosAnteriores },
      );
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.regenerarEquipamentosFinalizacao');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao regenerar equipamentos');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao regenerar equipamentos: ${(error as Error).message}`);
    }
  }

  async desvincularHistoria(personagemId: number, historiaId: number): Promise<unknown> {
    try {
      const raw = await this.apiClient.delete(`${this.baseUrl}/${personagemId}/historias/${historiaId}`);
      const env = assertLegacyEnvelope<unknown>(raw, 'PersonagemService.desvincularHistoria');
      if (!env.success) {
        throw new Error(env.message || 'Erro ao desvincular historia');
      }
      return env.data;
    } catch (error) {
      throw new Error(`Erro ao desvincular historia: ${(error as Error).message}`);
    }
  }
}
