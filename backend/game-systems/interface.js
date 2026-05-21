/**
 * Interface (contrato JSDoc) que todo engine de sistema de jogo deve implementar.
 *
 * Cada engine exporta um objeto com estas funções.
 * O registry (index.js) retorna o engine correto via getEngine(sistema).
 */

/**
 * @typedef {Object} ResultadoAtaque
 * @property {boolean} acertou
 * @property {number} dano
 * @property {boolean} critico
 * @property {Object} detalhes
 */

/**
 * @typedef {Object} ResultadoTeste
 * @property {boolean} sucesso
 * @property {number} rolagem
 * @property {Object} detalhes
 */

/**
 * @typedef {Object} AtributoDefinicao
 * @property {string} id - Nome interno (ex: "forca")
 * @property {string} nome - Nome display (ex: "Força")
 * @property {string} sigla - Abreviação (ex: "FOR")
 * @property {number} min - Valor mínimo
 * @property {number} max - Valor máximo
 */

/**
 * @typedef {Object} ProgressaoNivel
 * @property {number} pontosVantagem
 * @property {number} maxCustoDesvantagem
 * @property {number} tierMax
 */

/**
 * @typedef {Object} WizardStage
 * @property {string} id
 * @property {string} titulo
 */

/**
 * @typedef {Object} ResultadoValidacao
 * @property {boolean} valido
 * @property {string[]} erros
 */

/**
 * @typedef {Object} MagiaConhecida
 * @property {number} id - id no catálogo do sistema
 * @property {'habilidades_magias'|'magias_tresdet'} fonte - tabela de origem
 * @property {string} nome
 * @property {'magia'|'tecnica'} tipo
 * @property {string|null} escola - escola_magia (Lunaria/D&D) ou escola (3D&T)
 * @property {number|string} custo - custo_mana (number) ou custo_pm (string 3D&T)
 * @property {string} origem - 'criacao' | 'npc' | 'vantagem' | 'racial' | 'evento'
 * @property {Object|null} upgradeAtivo - upgrade de escalamento ativo (Lunaria) ou null
 */

/**
 * @typedef {Object} SlotsInfo
 * @property {boolean} usaSlots - true só para Lunaria
 * @property {number} total - total de slots no nível (0 se !usaSlots)
 * @property {number} usados - magias conhecidas que ocupam slot
 * @property {number} livres - total - usados
 * @property {'slots'|'mana'|'pm'} recurso
 */

/**
 * @typedef {Object} GameEngine
 * @property {(atacante: Object, defensor: Object, acao: Object) => ResultadoAtaque} resolverAtaque
 * @property {(personagem: Object) => number} calcularIniciativa
 * @property {(personagem: Object, atributo: string, dc: number) => ResultadoTeste} resolverTeste
 * @property {(personagem: Object, multRaca?: number) => number} calcularHP
 * @property {(personagem: Object) => number} calcularMP
 * @property {(personagem: Object) => number} calcularAtaque
 * @property {(personagem: Object) => number} calcularDefesa
 * @property {() => AtributoDefinicao[]} getAtributosBase
 * @property {(nivel: number) => ProgressaoNivel} getProgressaoNivel
 * @property {() => WizardStage[]} getWizardStages
 * @property {(dados: Object) => ResultadoValidacao} validarCriacao
 * @property {() => string} getRegrasMestrePrompt
 * @property {(personagem: Object, db: Object) => Promise<MagiaConhecida[]>} getMagiasConhecidas - magias/técnicas que o personagem já possui
 * @property {(personagem: Object, db: Object) => Promise<MagiaConhecida[]>} getMagiasDisponiveis - catálogo elegível, excluindo o já conhecido
 * @property {(personagem: Object, db: Object) => Promise<SlotsInfo>} getSlotsInfo - capacidade de magia do personagem
 */

/**
 * @typedef {Object} CombatState
 * @property {number} hp_max
 * @property {number} hp_atual
 * @property {number} mana_max
 * @property {number} mana_atual
 * @property {Object} ofensivo
 * @property {Object} defensivo
 * @property {string|null} dano_base
 * @property {string|null} elemento
 * @property {string} personagemNome
 */

/**
 * @typedef {Object} ConsumoResultado
 * @property {string} campo — 'hp' | 'mp'
 * @property {number|string} valor — number ou 'max'
 * @property {string} descricao
 */

/**
 * @typedef {Object} IniciativaConfig
 * @property {string} atributo — nome display ('Agilidade' ou 'Habilidade')
 * @property {number} lados — lados do dado (20 ou 6)
 * @property {number} modificador
 */

/**
 * Expanded GameEngine contract (v2):
 *
 * @property {(itensEquipados: Object[]) => Object} extrairBonusEquipamentos
 * @property {(personagemCompleto: Object|null, bonusEquip: Object) => CombatState} buildCombatState
 * @property {(personagem: Object) => IniciativaConfig} getIniciativaConfig
 * @property {(personagem: Object, item: Object) => ConsumoResultado[]} resolverConsumo
 */
