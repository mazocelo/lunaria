import type {
  BonusCombate,
  EfeitoCatalogo,
  VantagemDesvantagem as VantagemDesvantagemDTO,
} from '../types/api';
import type { ValidationResult } from './Personagem';

/**
 * Shape de entrada do construtor. Aceita o DTO validado pelo Zod no service
 * ou um objeto parcial — o Model so atribui defaults; o boundary de tipo e
 * o service (Fase 2b).
 */
type VantagemDesvantagemConstructorInput =
  | (Partial<VantagemDesvantagemDTO> & { [key: string]: unknown })
  | Record<string, unknown>;

/**
 * Modelo de Vantagem/Desvantagem.
 * Representa uma vantagem ou desvantagem no sistema.
 */
export class VantagemDesvantagem {
  id: number | null;
  nome: string;
  descricao: string;
  custo: number;
  tipo: string[];
  bonus: BonusCombate;
  restricao: Record<string, unknown>;
  dano_base: string;
  efeito: EfeitoCatalogo;
  usar: number;
  usos: number;
  elemento: string[];
  nivel: number;
  requisitos: Record<string, unknown>;
  criada_em: string | null;
  atualizada_em: string | null;

  constructor(data: VantagemDesvantagemConstructorInput = {}) {
    const d = data as Record<string, unknown>;
    this.id = (d.id as number | null) || null;
    this.nome = (d.nome as string | undefined) || '';
    this.descricao = (d.descricao as string | undefined) || '';
    this.custo = (d.custo as number | undefined) || 0;
    this.tipo = (d.tipo as string[]) || [];
    this.bonus = (d.bonus as BonusCombate | undefined) || {};
    this.restricao = (d.restricao as Record<string, unknown> | undefined) || {};
    this.dano_base = (d.dano_base as string | undefined) || '';
    this.efeito = (d.efeito as EfeitoCatalogo | undefined) || {};
    const usar = d.usar as number | null | undefined;
    const usos = d.usos as number | null | undefined;
    this.usar = (usar ?? usos ?? 0) as number;
    this.usos = (usos ?? this.usar) as number;
    this.elemento = (d.elemento as string[]) || [];
    this.nivel = (d.nivel as number | undefined) || 1;
    this.requisitos = (d.requisitos as Record<string, unknown> | undefined) || {};
    this.criada_em = (d.criada_em as string | null) || null;
    this.atualizada_em = (d.atualizada_em as string | null) || null;
  }

  /**
   * Converte o modelo para objeto simples.
   */
  toObject(): Record<string, unknown> {
    return {
      id: this.id,
      nome: this.nome,
      descricao: this.descricao,
      custo: this.custo,
      tipo: this.tipo,
      bonus: this.bonus,
      restricao: this.restricao,
      dano_base: this.dano_base,
      efeito: this.efeito,
      usar: this.usar,
      usos: this.usos,
      elemento: this.elemento,
      nivel: this.nivel,
      requisitos: this.requisitos,
      criada_em: this.criada_em,
      atualizada_em: this.atualizada_em,
    };
  }

  /**
   * Cria uma instancia a partir de dados da API.
   */
  static fromApi(
    apiData: VantagemDesvantagemDTO | Record<string, unknown>,
  ): VantagemDesvantagem {
    const d = apiData as Record<string, unknown>;
    const apiUsar = d.usar as number | null | undefined;
    const apiUsos = d.usos as number | null | undefined;
    return new VantagemDesvantagem({
      id: d.id as number | null,
      nome: d.nome as string,
      descricao: d.descricao as string,
      custo: d.custo as number,
      tipo: d.tipo as string[],
      bonus: d.bonus as BonusCombate,
      restricao: d.restricao as Record<string, unknown>,
      dano_base: d.dano_base as string,
      efeito: d.efeito as EfeitoCatalogo,
      usar: apiUsar ?? apiUsos,
      usos: apiUsos ?? apiUsar,
      elemento: d.elemento as string[],
      nivel: d.nivel as number,
      requisitos: d.requisitos as Record<string, unknown>,
      criada_em: d.criada_em as string | null,
      atualizada_em: d.atualizada_em as string | null,
    });
  }

  /**
   * Valida se os dados da vantagem/desvantagem estao corretos.
   */
  validate(): ValidationResult {
    const errors: string[] = [];

    if (!this.nome.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (this.nome.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }

    if (this.descricao.length > 1000) {
      errors.push('Descrição deve ter no máximo 1000 caracteres');
    }

    if (typeof this.custo !== 'number') {
      errors.push('Custo deve ser um número');
    }

    if (this.custo < -20 || this.custo > 20) {
      errors.push('Custo deve estar entre -20 e 20');
    }

    if (this.nivel < 1 || this.nivel > 10) {
      errors.push('Nível deve estar entre 1 e 10');
    }

    if (this.usar < 0 || this.usar > 10) {
      errors.push('Usar deve estar entre 0 e 10');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verifica se e uma vantagem.
   */
  isVantagem(): boolean {
    return this.custo > 0;
  }

  /**
   * Verifica se e uma desvantagem.
   */
  isDesvantagem(): boolean {
    return this.custo < 0;
  }

  /**
   * Obtem o tipo de vantagem/desvantagem.
   */
  getTipo(): 'vantagem' | 'desvantagem' | 'neutro' {
    if (this.isVantagem()) return 'vantagem';
    if (this.isDesvantagem()) return 'desvantagem';
    return 'neutro';
  }
}
