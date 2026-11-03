import type { BonusAtributos, Raca as RacaDTO } from '../types/api';
import type { ValidationResult } from './Personagem';

/**
 * Shape de entrada do construtor. Aceita o DTO validado pelo Zod no service
 * ou um objeto parcial — o Model so atribui defaults; o boundary de tipo e
 * o service (Fase 2b).
 */
type RacaConstructorInput =
  | (Partial<RacaDTO> & { [key: string]: unknown })
  | Record<string, unknown>;

/**
 * Modelo de Raca.
 * Representa uma raca no sistema.
 */
export class Raca {
  id: number | null;
  nome: string;
  descricao: string;
  custo: number;
  bonus: BonusAtributos;
  atributos_bonus: BonusAtributos;
  vantagens_iniciais: unknown[];
  desvantagens_iniciais: unknown[];
  created_at: string | null;
  updated_at: string | null;

  constructor(data: RacaConstructorInput = {}) {
    const d = data as Record<string, unknown>;
    this.id = (d.id as number | null) || null;
    this.nome = (d.nome as string | undefined) || '';
    this.descricao = (d.descricao as string | undefined) || '';
    this.custo = (d.custo as number | undefined) || 0;
    this.bonus =
      (d.bonus as BonusAtributos | undefined) ||
      (d.atributos_bonus as BonusAtributos | undefined) ||
      {};
    this.atributos_bonus = (d.atributos_bonus as BonusAtributos | undefined) || this.bonus || {};
    this.vantagens_iniciais = (d.vantagens_iniciais as unknown[]) || [];
    this.desvantagens_iniciais = (d.desvantagens_iniciais as unknown[]) || [];
    this.created_at = (d.created_at as string | null) || null;
    this.updated_at = (d.updated_at as string | null) || null;
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
      bonus: this.bonus,
      atributos_bonus: this.atributos_bonus,
      vantagens_iniciais: this.vantagens_iniciais,
      desvantagens_iniciais: this.desvantagens_iniciais,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  /**
   * Cria uma instancia a partir de dados da API.
   */
  static fromApi(apiData: RacaDTO | Record<string, unknown>): Raca {
    const d = apiData as Record<string, unknown>;
    return new Raca({
      id: d.id as number | null,
      nome: d.nome as string,
      descricao: d.descricao as string,
      custo: d.custo as number,
      bonus: d.bonus as BonusAtributos,
      atributos_bonus: (d.atributos_bonus as BonusAtributos) || (d.bonus as BonusAtributos),
      vantagens_iniciais: d.vantagens_iniciais as unknown[],
      desvantagens_iniciais: d.desvantagens_iniciais as unknown[],
      created_at: d.created_at as string | null,
      updated_at: d.updated_at as string | null,
    });
  }

  /**
   * Valida se os dados da raca estao corretos.
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

    if (this.custo < -10 || this.custo > 10) {
      errors.push('Custo deve estar entre -10 e 10');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
