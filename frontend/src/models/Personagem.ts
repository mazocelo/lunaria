import { calcularHPMaximo as _calcHPMax } from '../utils/rpgHelpers.js';
import type {
  Personagem as PersonagemDTO,
  PersonagemUpdatePayload,
} from '../types/api';

/**
 * Shape de entrada do construtor. O caller pode passar:
 *   - um DTO ja validado pelo Zod no service (`PersonagemDTO`);
 *   - um payload parcial (forms, criacao via wizard, clone via `toJSON()`);
 *   - propriedades extras (atributos escalares legados, hp/mp, etc.).
 *
 * A Fase 2 garante que tudo que vem da API ja passou por
 * `parseRaw(personagemSchema, ...)`. Aqui dentro NAO duplicamos a validacao —
 * o Model so atribui defaults; o boundary de tipo e o service.
 *
 * `index signature` com `unknown` cobre os campos legados que ainda nao estao
 * no schema (ex.: `forca`, `destreza`, `hp_atual`, `historia_nome`) sem
 * usar `any` nem quebrar a leitura tolerante do `data.xxx ?? null`.
 */
type PersonagemConstructorInput =
  | (Partial<PersonagemDTO> & { [key: string]: unknown })
  | Record<string, unknown>;

/**
 * Resultado da validacao. Compartilhado com os demais Models (mesmo formato
 * de `{ isValid, errors }` em `Classe`, `Raca`, `Historia`,
 * `VantagemDesvantagem`). Tipo simples; sem mudanca comportamental.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ValidateOptions {
  context?: 'default' | 'criacao';
}

const ATRIBUTOS_BASICOS = [
  'forca',
  'destreza',
  'constituicao',
  'inteligencia',
  'agilidade',
  'carisma',
] as const;

type AtributoBasico = (typeof ATRIBUTOS_BASICOS)[number];

/**
 * Modelo de dados para Personagem
 * Responsavel pela estrutura e validacao dos dados.
 */
export class Personagem {
  id: number | null;
  nome: string;
  classe_id: number | null;
  raca_id: number | null;
  classe: string | null;
  raca: string | null;
  historia_nome: string | null;
  historia_id: number | null;
  historias: unknown[];
  racas: unknown;
  classes: unknown;
  imagem: string | null;
  nivel: number;
  sistema: string;
  atributos: Record<string, number>;
  stats_sistema: Record<string, unknown> | null;
  // Atributos escalares: `null` quando nao ha fonte (vide hardening 2026-05-22),
  // NUNCA caem para `10` por default — isso mascarava atributo ausente.
  forca: number | null;
  destreza: number | null;
  constituicao: number | null;
  inteligencia: number | null;
  agilidade: number | null;
  carisma: number | null;
  sugestao_background: string;
  background: string;
  vantagens: unknown[];
  desvantagens: unknown[];
  equipamentos: unknown[];
  habilidadesClasse: unknown[];
  magias: unknown[];
  xp_atual: number;
  xp_proximo_nivel: number;
  hp_max: number;
  hp: number;
  mp: number | null;
  pontos_atributo_pendentes: number;
  pontos_iniciais: number;
  pontos_totais: number;
  voice_id: string | null;
  voice_provider: string | null;
  created_at: Date | string;
  updated_at: Date | string;

  constructor(data: PersonagemConstructorInput = {}) {
    const d = data as Record<string, unknown>;
    const atributos = (d.atributos as Record<string, number> | undefined) ?? {};

    this.id = (d.id as number | null) || null;
    this.nome = (d.nome as string | undefined) || '';
    this.classe_id = (d.classe_id as number | null) || null;
    this.raca_id = (d.raca_id as number | null) || null;
    this.classe = (d.classe as string | null) || null; // Nome da classe (string)
    this.raca = (d.raca as string | null) || null; // Nome da raca (string)
    this.historia_nome = (d.historia_nome as string | null) || null; // Nome da primeira historia (compatibilidade)
    this.historia_id = (d.historia_id as number | null) || null; // ID da primeira historia (compatibilidade)
    this.historias = (d.historias as unknown[]) || []; // Array de historias vinculadas
    this.racas = d.racas ?? null; // Objeto completo da raca (com bonus)
    this.classes = d.classes ?? null; // Objeto completo da classe (com bonus)
    this.imagem = (d.imagem as string | null) || null;
    this.nivel = (d.nivel as number | undefined) || 1;
    this.sistema = (d.sistema as string | undefined) || 'lunaria';
    this.atributos = atributos;
    // JSON especifico do sistema (D&D 5e: classeKey, metodo, skillProficiencies).
    this.stats_sistema = (d.stats_sistema as Record<string, unknown> | null) || null;
    // Atributos individuais: prioriza o mapa data.atributos (fonte do backend),
    // fallback para campos escalares (usados na criacao Lunaria).
    // NAO cair para 10 quando nao ha fonte real: falhar explicito > mascarar
    // atributo ausente e gravar 10/10/10 silenciosamente.
    this.forca = (atributos.forca ?? (d.forca as number | null | undefined)) ?? null;
    this.destreza = (atributos.destreza ?? (d.destreza as number | null | undefined)) ?? null;
    this.constituicao = (atributos.constituicao ?? (d.constituicao as number | null | undefined)) ?? null;
    this.inteligencia = (atributos.inteligencia ?? (d.inteligencia as number | null | undefined)) ?? null;
    this.agilidade = (atributos.agilidade ?? (d.agilidade as number | null | undefined)) ?? null;
    this.carisma = (atributos.carisma ?? (d.carisma as number | null | undefined)) ?? null;
    this.sugestao_background = (d.sugestao_background as string | undefined) || 'guiado';
    this.background = (d.background as string | undefined) || '';
    this.vantagens = (d.vantagens as unknown[]) || [];
    this.desvantagens = (d.desvantagens as unknown[]) || [];
    this.equipamentos = (d.equipamentos as unknown[]) || [];
    this.habilidadesClasse = (d.habilidadesClasse as unknown[]) || [];
    this.magias = (d.magias as unknown[]) || [];
    this.xp_atual = (d.xp_atual as number | undefined) || 0;
    this.xp_proximo_nivel = (d.xp_proximo_nivel as number | undefined) || 100;
    this.hp_max =
      (d.hp_max as number | undefined) ||
      (d.hp_maximo as number | undefined) ||
      this.calcularHPMaximo();
    this.hp = (d.hp_atual as number | null | undefined) ?? (d.hp as number | null | undefined) ?? this.hp_max;
    this.mp = (d.mp_atual as number | null | undefined) ?? (d.mp as number | null | undefined) ?? null;
    this.pontos_atributo_pendentes = (d.pontos_atributo_pendentes as number | undefined) || 0;
    this.pontos_iniciais = (d.pontos_iniciais as number | undefined) || 0;
    this.pontos_totais = (d.pontos_totais as number | undefined) || 0;
    this.voice_id = (d.voice_id as string | null) || null;
    this.voice_provider = (d.voice_provider as string | null) || null;
    this.created_at = (d.created_at as Date | string | undefined) || new Date();
    this.updated_at = (d.updated_at as Date | string | undefined) || new Date();
  }

  /**
   * Valida se o modelo esta correto.
   */
  validate(options: ValidateOptions = {}): ValidationResult {
    const errors: string[] = [];
    const { context = 'default' } = options;

    if (!this.nome || this.nome.trim().length === 0) {
      errors.push('Nome do personagem é obrigatório');
    }

    if (this.nome && this.nome.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (this.nivel < 1) {
      errors.push('Nível deve ser pelo menos 1');
    }

    if (this.nivel > 20) {
      errors.push('Nível máximo é 20');
    }

    // Validar atributos (1-20) — deve receber valores BASE (sem bônus)
    const atributosNumericos = ATRIBUTOS_BASICOS.map((atributo) => ({
      atributo,
      valor: Number(this[atributo]),
    }));

    if (context === 'criacao') {
      if (!this.raca_id) {
        errors.push('Selecione uma raça para o personagem');
      }
      if (!this.classe_id) {
        errors.push('Selecione uma classe para o personagem');
      }

      atributosNumericos.forEach(({ atributo, valor }) => {
        if (!Number.isFinite(valor) || valor < 5 || valor > 16) {
          errors.push(`${atributo.charAt(0).toUpperCase() + atributo.slice(1)} deve estar entre 5 e 16 na criacao`);
        }
      });

      const somaAtributos = atributosNumericos.reduce(
        (sum, item) => sum + (Number.isFinite(item.valor) ? item.valor : 0),
        0,
      );

      if (somaAtributos !== 60) {
        errors.push('A distribuicao inicial deve somar 60 pontos');
      }
    } else {
      // Fora da criacao os atributos nao sao editaveis (PUT nao os altera) e
      // podem estar ausentes quando a ficha foi carregada via mapa `atributos`.
      // So validar a faixa quando ha um valor escalar real — nunca tratar
      // ausencia (null/undefined) como erro nem mascarar com default.
      ATRIBUTOS_BASICOS.forEach((atributo) => {
        const bruto = this[atributo];
        if (bruto === null || bruto === undefined) return;
        const valor = Number(bruto);
        if (!Number.isFinite(valor) || valor < 1 || valor > 20) {
          errors.push(`${atributo.charAt(0).toUpperCase() + atributo.slice(1)} deve estar entre 1 e 20`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calcula o modificador de um atributo.
   */
  getModificador(atributo: AtributoBasico | string): number {
    const valor = (this as unknown as Record<string, number | null | undefined>)[atributo] || 10;
    return Math.floor((valor - 10) / 2);
  }

  /**
   * Calcula taxa de esquiva base (%).
   * Formula: (ModAGI + floor(ModDEX/2)) * 5, cap 0-50
   */
  getEsquiva(): number {
    const modAgi = this.getModificador('agilidade');
    const modDex = this.getModificador('destreza');
    return Math.min(50, Math.max(0, (modAgi + Math.floor(modDex / 2)) * 5));
  }

  /**
   * Calcula pontos de vida maximos.
   */
  calcularHPMaximo(): number {
    return _calcHPMax(this);
  }

  /**
   * Payload para o PUT /personagens/:id.
   * O PUT nao altera mais atributos (mudam so na criacao e em distribuir-pontos),
   * entao este payload NAO inclui os campos escalares de atributo nem o mapa
   * `atributos` — apenas os campos que o PUT realmente atualiza. Enviar atributo
   * aqui seria uma porta de corrupcao da ficha.
   */
  toUpdatePayload(): PersonagemUpdatePayload {
    return {
      nome: this.nome,
      imagem: this.imagem,
      background: this.background,
      sugestao_background: this.sugestao_background,
      historias: this.historias,
      vantagens: this.vantagens,
      desvantagens: this.desvantagens,
      equipamentos: this.equipamentos,
    };
  }

  /**
   * Converte para objeto plano. Usado como payload de CRIACAO (POST), que
   * aceita os atributos escalares. NAO usar para o PUT — use toUpdatePayload().
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      nome: this.nome,
      classe_id: this.classe_id,
      raca_id: this.raca_id,
      classe: this.classe,
      raca: this.raca,
      historia_nome: this.historia_nome,
      historia_id: this.historia_id,
      historias: this.historias,
      racas: this.racas,
      classes: this.classes,
      imagem: this.imagem,
      nivel: this.nivel,
      sistema: this.sistema,
      atributos: this.atributos,
      stats_sistema: this.stats_sistema,
      forca: this.forca,
      destreza: this.destreza,
      constituicao: this.constituicao,
      inteligencia: this.inteligencia,
      agilidade: this.agilidade,
      carisma: this.carisma,
      sugestao_background: this.sugestao_background,
      background: this.background,
      vantagens: this.vantagens,
      desvantagens: this.desvantagens,
      equipamentos: this.equipamentos,
      habilidadesClasse: this.habilidadesClasse,
      magias: this.magias,
      xp_atual: this.xp_atual,
      xp_proximo_nivel: this.xp_proximo_nivel,
      hp: this.hp,
      hp_max: this.hp_max,
      mp: this.mp,
      pontos_atributo_pendentes: this.pontos_atributo_pendentes,
      pontos_iniciais: this.pontos_iniciais,
      pontos_totais: this.pontos_totais,
      voice_id: this.voice_id,
      voice_provider: this.voice_provider,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  /**
   * Cria uma nova instancia a partir de dados da API.
   * Aceita o DTO validado por `personagemSchema` (passa pelo service) ou um
   * objeto solto com os mesmos campos.
   */
  static fromAPI(apiData: PersonagemDTO | Record<string, unknown>): Personagem {
    const d = apiData as Record<string, unknown>;
    return new Personagem({
      id: d.id as number | null,
      nome: d.nome as string,
      classe_id: d.classe_id as number | null,
      raca_id: d.raca_id as number | null,
      classe: d.classe as string | null, // Nome da classe
      raca: d.raca as string | null, // Nome da raca
      historia_nome: d.historia_nome as string | null, // Nome da primeira historia (compatibilidade)
      historia_id: d.historia_id as number | null, // ID da primeira historia (compatibilidade)
      historias: (d.historias as unknown[]) || [], // Array de historias vinculadas
      racas: d.racas ?? null,
      classes: d.classes ?? null,
      imagem: (d.imagem as string | null) || null,
      nivel: d.nivel as number,
      sistema: (d.sistema as string) || 'lunaria',
      atributos: (d.atributos as Record<string, number>) || {},
      stats_sistema: (d.stats_sistema as Record<string, unknown> | null) || null,
      forca: d.forca as number | null,
      destreza: d.destreza as number | null,
      constituicao: d.constituicao as number | null,
      inteligencia: d.inteligencia as number | null,
      agilidade: d.agilidade as number | null,
      carisma: d.carisma as number | null,
      sugestao_background: d.sugestao_background as string,
      background: d.background as string,
      vantagens: d.vantagens as unknown[],
      desvantagens: d.desvantagens as unknown[],
      equipamentos: d.equipamentos as unknown[],
      habilidadesClasse: d.habilidadesClasse as unknown[],
      magias: d.magias as unknown[],
      xp_atual: (d.xp_atual as number) || 0,
      xp_proximo_nivel: (d.xp_proximo_nivel as number) || 100,
      hp_max: (d.hp_max as number) || (d.hp_maximo as number),
      hp_atual: d.hp_atual as number | null,
      hp: d.hp as number | null,
      mp_atual: d.mp_atual as number | null,
      mp: d.mp as number | null,
      pontos_atributo_pendentes: (d.pontos_atributo_pendentes as number) || 0,
      pontos_iniciais: d.pontos_iniciais as number,
      pontos_totais: d.pontos_totais as number,
      voice_id: d.voice_id as string | null,
      voice_provider: d.voice_provider as string | null,
      created_at: d.created_at as Date | string,
      updated_at: d.updated_at as Date | string,
    });
  }

  /**
   * Cria uma copia do modelo.
   */
  clone(): Personagem {
    return new Personagem(this.toJSON());
  }

  /**
   * Atualiza os dados do modelo.
   */
  update(updates: Partial<Record<string, unknown>>): void {
    Object.assign(this, updates);
    this.updated_at = new Date();
  }
}
