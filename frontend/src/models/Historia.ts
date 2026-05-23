import type { Historia as HistoriaDTO } from '../types/api';
import type { ValidationResult } from './Personagem';

/**
 * Shape de entrada do construtor. Aceita o DTO validado pelo Zod no service
 * ou um objeto parcial — o Model so atribui defaults; o boundary de tipo e
 * o service (Fase 2b).
 */
type HistoriaConstructorInput =
  | (Partial<HistoriaDTO> & { [key: string]: unknown })
  | Record<string, unknown>;

/**
 * Modelo de dados para Historia.
 * Responsavel pela estrutura e validacao dos dados.
 */
export class Historia {
  id: number | null;
  nome: string;
  temas: number[];
  maximo_de_participantes: number;
  descricao: string;
  prologo: string;
  mestre_id: number | null;
  mestre: unknown;
  imagem: string | null;
  mapas: unknown;
  config: Record<string, unknown> | null;
  mestre_tier: string;
  id_usuario: number | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;

  constructor(data: HistoriaConstructorInput = {}) {
    const d = data as Record<string, unknown>;
    this.id = (d.id as number | null) || null;
    this.nome = (d.nome as string | undefined) || '';
    this.temas = (d.temas as number[]) || [];
    this.maximo_de_participantes = (d.maximo_de_participantes as number | undefined) || 3;
    this.descricao = (d.descricao as string | undefined) || '';
    this.prologo = (d.prologo as string | undefined) || '';
    this.mestre_id = (d.mestre_id as number | null) || null;
    this.mestre = d.mestre ?? null;
    this.imagem = (d.imagem as string | null) || null;
    this.mapas = (d.mapas as unknown[] | null) ?? [];
    this.config = (d.config as Record<string, unknown> | null) || null;
    this.mestre_tier = (d.mestre_tier as string | undefined) || 'poeta';
    this.id_usuario = (d.id_usuario as number | null) || null;
    this.created_at = (d.created_at as string | Date | null) || null;
    this.updated_at = (d.updated_at as string | Date | null) || null;
  }

  /**
   * Valida se o modelo esta correto.
   */
  validate(): ValidationResult {
    const errors: string[] = [];

    if (this.nome && this.nome.trim().length > 0 && this.nome.trim().length < 3) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }

    if (this.maximo_de_participantes < 1) {
      errors.push('Minimo de 1 participante');
    }

    if (this.maximo_de_participantes > 10) {
      errors.push('Máximo de 10 participantes');
    }

    if (this.temas && this.temas.length > 3) {
      errors.push('Máximo de 3 temas permitidos');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Converte para objeto plano.
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      nome: this.nome,
      temas: this.temas,
      maximo_de_participantes: this.maximo_de_participantes,
      descricao: this.descricao,
      prologo: this.prologo,
      mestre_id: this.mestre_id,
      mestre_tier: this.mestre_tier,
      imagem: this.imagem,
      mapas: this.mapas,
      config: this.config,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  /**
   * Cria uma nova instancia a partir de dados da API.
   */
  static fromAPI(apiData: HistoriaDTO | Record<string, unknown>): Historia {
    const d = apiData as Record<string, unknown>;
    return new Historia({
      id: d.id as number | null,
      nome: d.nome as string,
      temas: (d.temas as number[]) || [],
      maximo_de_participantes: d.maximo_de_participantes as number,
      descricao: (d.descricao as string) || '',
      prologo: (d.prologo as string) || '',
      mestre_id: (d.mestre_id as number | null) || null,
      mestre: d.mestres ?? d.mestre ?? null,
      imagem: (d.imagem as string | null) || null,
      mapas: (d.mapas as unknown[]) || [],
      config: (d.config as Record<string, unknown> | null) || null,
      id_usuario: d.id_usuario as number | null, // ID do usuario dono da historia
      created_at: (d.criada_em as string | null) || (d.created_at as string | null) || null,
      updated_at: (d.atualizada_em as string | null) || (d.updated_at as string | null) || null,
    });
  }

  /**
   * Cria uma copia do modelo.
   */
  clone(): Historia {
    return new Historia(this.toJSON());
  }

  /**
   * Atualiza os dados do modelo.
   */
  update(updates: Partial<Record<string, unknown>>): void {
    Object.assign(this, updates);
    this.updated_at = new Date();
  }
}
