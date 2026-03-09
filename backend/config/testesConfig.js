/**
 * Configuração do sistema de testes de habilidade
 * Mapeamento habilidade → atributo + escala de DC
 *
 * A IA escolhe QUANDO testar e QUAL dificuldade (criativo)
 * O motor mecânico aplica modificadores e resolve (previsível)
 */

export const TESTES_CONFIG = {
  // Escala de DC — IA usa esses nomes no campo "dificuldade"
  dificuldade: {
    'Muito Fácil': 5,
    'Fácil': 8,
    'Média': 12,
    'Difícil': 15,
    'Muito Difícil': 18,
    'Quase Impossível': 20
  },

  // Mapeamento habilidade → atributo primário da ficha
  habilidades: {
    // Testes diretos (nome = atributo)
    'Força': 'forca',
    'Destreza': 'destreza',
    'Constituição': 'constituicao',
    'Inteligência': 'inteligencia',
    'Agilidade': 'agilidade',
    'Carisma': 'carisma',

    // Testes derivados — Força
    'Atletismo': 'forca',
    'Intimidação': 'forca',

    // Testes derivados — Destreza
    'Acrobacia': 'destreza',
    'Arrombamento': 'destreza',
    'Prestidigitação': 'destreza',

    // Testes derivados — Constituição
    'Resistência': 'constituicao',
    'Fortitude': 'constituicao',
    'Vigor': 'constituicao',
    'Sobrevivência': 'constituicao',

    // Testes derivados — Inteligência
    'Investigação': 'inteligencia',
    'Percepção': 'inteligencia',
    'Conhecimento': 'inteligencia',
    'Arcano': 'inteligencia',

    // Testes derivados — Agilidade
    'Furtividade': 'agilidade',
    'Reflexos': 'agilidade',
    'Esquiva': 'agilidade',

    // Testes derivados — Carisma
    'Persuasão': 'carisma',
    'Enganação': 'carisma',
    'Intuição': 'carisma',
    'Performance': 'carisma',
    'Liderança': 'carisma',

    // Sem modificador (d20 puro)
    'Sorte': null
  },

  // DC padrão quando IA não especifica ou valor inválido
  DC_PADRAO: 12,

  // Atributos válidos do sistema
  ATRIBUTOS: ['forca', 'inteligencia', 'carisma', 'destreza', 'constituicao', 'agilidade'],

  // Nomes display dos atributos (pt-BR)
  ATRIBUTOS_DISPLAY: {
    'forca': 'Força',
    'destreza': 'Destreza',
    'constituicao': 'Constituição',
    'inteligencia': 'Inteligência',
    'agilidade': 'Agilidade',
    'carisma': 'Carisma'
  }
};
