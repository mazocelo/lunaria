# Spec: Engine Boundaries — Integração 3D&T no Pipeline de Combate

**Data:** 2026-03-23
**Status:** Aprovado
**Versão:** 1.1
**Complementa:** `2026-03-19-game-engine-redesign.md`

---

## 1. Problema

O pipeline de combate (websocket `combatEngine` → `combateHelper` → `gameEngine`) assume Lunaria em 6 pontos críticos:

1. **`personagensHelper.js`** — carrega equipamentos só de `personagem_equipamento` (Lunaria), nunca de `personagem_item_tresdet`. Atributos hardcoded como `forca, destreza, constituicao` (Lunaria) em vez de `F, H, R, A, PdF` (3D&T).
2. **`combatEngine.js` (websocket)** — monta stats de combate com fórmulas Lunaria (constituição, destreza, agilidade, d20).
3. **`combatEngine.js` (websocket)** — iniciativa de monstros e jogadores usa d20 + agilidade (Lunaria). 3D&T usa d6 + H.
4. **`bonusHelper.js`** — `agregarBonusEquipamentos` espera campo `bonus` (Lunaria). Itens 3D&T usam `poderes` (JSON descritivo) e modificam características base (F/A/PdF/H).
5. **`combateHelper.js`** — `resolverMecanicaCombate` usa teste d20 + DC, nunca FA vs FD (3D&T).
6. **`economiaHelper.js`** — `LIMITES_EQUIP` não inclui tipo `mecha`.

O resultado: personagens 3D&T entram em combate com stats zerados ou calculados com fórmulas erradas.

## 2. Princípio

**O engine do sistema resolve TUDO que é mecânico. O websocket orquestra.**

A interface `GameEngine` (`game-systems/interface.js`) já define o contrato base. Ela será expandida com métodos que cobrem o ciclo completo de combate, para que o websocket nunca precise saber as fórmulas de nenhum sistema.

## 3. Interface Expandida

### Métodos novos em `game-systems/interface.js`

```js
/**
 * @typedef {Object} CombatState
 * @property {number} hp_max
 * @property {number} hp_atual
 * @property {number} mana_max
 * @property {number} mana_atual
 * @property {Object} ofensivo   — stats de ataque (formato varia por engine)
 * @property {Object} defensivo  — stats de defesa (formato varia por engine)
 * @property {string} dano_base
 * @property {string|null} elemento
 * @property {string} personagemNome
 */

/**
 * @typedef {Object} EquipBonus
 * Engine-specific bonus aggregation result.
 * Lunaria: { ataque, dano, armadura, esquiva_bonus, esquiva_penalidade }
 * TresDet: { F, A, PdF, H, iniciativa, especiais[] }
 */

/**
 * @typedef {Object} ConsumoResultado
 * @property {string} campo — 'hp' | 'mp'
 * @property {number|'max'} valor
 * @property {string} descricao
 */

/**
 * @typedef {Object} IniciativaConfig
 * @property {string} atributo — nome do atributo para display ('Agilidade' ou 'H')
 * @property {number} lados — lados do dado (20 ou 6)
 * @property {number} modificador — bonus numérico do atributo
 */

/**
 * Novos métodos no contrato GameEngine:
 *
 * buildCombatState(personagemCompleto, bonusEquip) → CombatState
 *   Monta o state de combate a partir do personagem completo + bônus de equip.
 *   Cada engine retorna o shape que faz sentido pro seu sistema.
 *   Se personagemCompleto é null/incompleto, retorna defaults seguros do sistema.
 *
 * extrairBonusEquipamentos(itensEquipados) → EquipBonus
 *   Extrai bônus mecânicos dos itens equipados. Função pura, sem DB.
 *   Lunaria: lê campo `bonus` de cada equipamento.
 *   TresDet: parseia nome do item para extrair +N em F/A/PdF/H.
 *
 * resolverConsumo(personagem, item) → ConsumoResultado[]
 *   Aplica efeito mecânico de consumível (restaurar PV/PM, curar veneno, etc.)
 *   SEMPRE retorna array (mesmo para efeito único) para consistência.
 *
 * getIniciativaConfig(personagem) → IniciativaConfig
 *   Retorna metadados de iniciativa (atributo, dado, modificador) para
 *   o frontend e para o cálculo de iniciativa de monstros.
 */
```

### `carregarInventario` — fica no Model, não no engine

Os engines são funções puras (sem DB, sem side effects). O carregamento de inventário é responsabilidade da camada Model, seguindo o padrão Controller → Service → Model do projeto.

`personagensHelper.js` despacha para o Model correto baseado no sistema:
```js
const sistema = personagem.sistema || 'lunaria';
let inventario;
if (sistema === 'tresdet') {
  inventario = await db.PersonagemItemTresDet.listarInventario(personagem.id);
} else {
  inventario = await db.Personagem.listarEquipamentos(personagem.id);
}
```

Os Models `PersonagemItemTresDet` e `Personagem.listarEquipamentos` já existem.

### Métodos existentes (sem mudança na assinatura)
- `resolverAtaque(atacante, defensor, acao)` — já implementado em ambos engines
- `calcularIniciativa(personagem)` — já implementado
- `calcularHP(personagem)` / `calcularMP(personagem)` — já implementados
- `getRegrasMestrePrompt()` — já implementado

### `resolverAtaque` — shape de retorno unificado

Ambos engines devem retornar o mesmo shape base para que o pipeline consuma sem branching:

```js
{
  acertou: boolean,
  dano: number,
  critico: boolean,
  detalhes: string,       // texto legível do cálculo
  dados: { ... },         // engine-specific (FA/FD ou d20/DC)
}
```

O campo `detalhes` é string pra narrativa. O campo `dados` é objeto opaco para debug/log.

## 4. Implementação por Engine

### 4.1 TresDet (`game-systems/tresdet/`)

#### `extrairBonusEquipamentos(itensEquipados)`

Itens 3D&T não têm campo `bonus`. O bônus é derivado do nome do item via regex:

| Padrão no nome | Extração |
|----------------|----------|
| `Arma Mágica: Bônus Mágico +N` | `{ F: +N, PdF: +N }` (jogador escolhe qual usar) |
| `Armadura Mágica: Bônus Mágico +N` | `{ A: +N }` |
| `Arma Mágica: Veloz` | `{ iniciativa: +2 }` |
| `Arma Mágica: Flagelo (X)` | `{ especiais: [{ tipo: 'flagelo', alvo: X, bonus: 1 }] }` |
| `Arma Mágica: Ataque Especial` | `{ especiais: [{ tipo: 'ataque_especial', bonus: 2, usos: 1 }] }` |
| `Armadura Mágica: Armadura Extra (X)` | `{ especiais: [{ tipo: 'armadura_extra', elemento: X }] }` |
| `Armadura Mágica: Invulnerável (X)` | `{ especiais: [{ tipo: 'invulneravel', elemento: X }] }` |

**Tradeoff conhecido:** regex sobre nomes é frágil se itens forem renomeados. Aceito por KISS dado os 90 itens fixos do seed. Se itens customizados forem adicionados no futuro, considerar campo estruturado `bonus_mecanico` na tabela `itens_tresdet`.

#### `buildCombatState(personagemCompleto, bonusEquip)`

Usa `calcularHP()` e `calcularMP()` já existentes no engine (sem duplicar fórmulas):

```js
const hp_max = calcularHP(personagemCompleto);
const mp_max = calcularMP(personagemCompleto);

return {
  hp_max,
  hp_atual: personagemCompleto.hp_atual ?? hp_max,
  mana_max: mp_max,
  mana_atual: personagemCompleto.mana_atual ?? mp_max,
  ofensivo: {
    F: getAtributo(personagemCompleto, 'F', 0) + (bonusEquip.F || 0),
    PdF: getAtributo(personagemCompleto, 'PdF', 0) + (bonusEquip.PdF || 0),
    H: getAtributo(personagemCompleto, 'H', 0) + (bonusEquip.H || 0),
  },
  defensivo: {
    A: getAtributo(personagemCompleto, 'A', 0) + (bonusEquip.A || 0),
    H: getAtributo(personagemCompleto, 'H', 0) + (bonusEquip.H || 0),
  },
  iniciativa_bonus: bonusEquip.iniciativa || 0,
  especiais: bonusEquip.especiais || [],
  dano_base: null,
  elemento: null,
  personagemNome: personagemCompleto.nome || 'Personagem',
};
```

**Fallback para personagem null/incompleto:**
```js
if (!personagemCompleto) {
  return {
    hp_max: 5, hp_atual: 5,
    mana_max: 0, mana_atual: 0,
    ofensivo: { F: 1, PdF: 0, H: 1 },
    defensivo: { A: 1, H: 1 },
    iniciativa_bonus: 0, especiais: [],
    dano_base: null, elemento: null,
    personagemNome: 'Personagem',
  };
}
```

#### `resolverAtaque` — expandir com crítico

O `resolverAtaque` existente já calcula FA/FD corretamente. As mudanças:
- **Bônus de equip já estão somados nos atributos** pelo `buildCombatState`, então `resolverAtaque` não precisa mudar para bônus.
- **Adicionar crítico:** dado = 6 → dobra F/PdF (FA) ou A (FD).
- **Unificar shape de retorno** conforme seção 3.

#### `getIniciativaConfig(personagem)`

```js
{
  atributo: 'Habilidade',
  lados: 6,
  modificador: getAtributo(personagem, 'H', 0) + (personagem.iniciativa_bonus || 0),
}
```

#### `resolverConsumo(personagem, item)`

Parseia campo `efeito` do item via regex. Sempre retorna array:

- "Restaura 5 Pontos de Vida" → `[{ campo: 'hp', valor: 5, descricao: 'Restaura 5 PV' }]`
- "Restaura todos os Pontos de Vida" → `[{ campo: 'hp', valor: 'max', descricao: 'Restaura todos PV' }]`
- "Restaura 5 PV e 5 PM" → `[{ campo: 'hp', valor: 5, ... }, { campo: 'mp', valor: 5, ... }]`

### 4.2 Lunaria (`game-systems/lunaria/`)

Wrap das funções existentes nos novos métodos:

- `extrairBonusEquipamentos` → delega para `agregarBonusEquipamentos` existente em `bonusHelper.js`
- `buildCombatState` → replica a lógica atual do websocket `combatEngine.js` (linhas 97-128), com fallback para personagem null
- `resolverConsumo` → a implementar (Lunaria não tinha consumíveis ativos)
- `getIniciativaConfig` → `{ atributo: 'Agilidade', lados: 20, modificador: floor((agilidade - 10) / 2) }`

### 4.3 D&D 5e (`game-systems/dnd5e/`)

Stub dos novos métodos com `throw new Error('Not implemented: <método>')`. D&D 5e não tem sessões ativas no momento. Será implementado quando houver demanda.

## 5. Mudanças no Pipeline

### 5.1 `personagensHelper.js`

**Antes:** sempre `db.Personagem.listarEquipamentos()`, atributos hardcoded Lunaria.
**Depois:**

```js
const sistema = personagem.sistema || 'lunaria';
const engine = getEngine(sistema);

// Inventario: despacha para Model correto
let itensEquipados;
if (sistema === 'tresdet') {
  const inv = await db.PersonagemItemTresDet.listarInventario(personagem.id);
  itensEquipados = inv.filter(e => e.equipado).map(e => e.item);
} else {
  const equipamentos = await db.Personagem.listarEquipamentos(personagem.id);
  itensEquipados = equipamentos.map(e => e.equipamento || e);
}

// Bonus: engine extrai do formato correto
const bonusEquip = engine.extrairBonusEquipamentos(itensEquipados);
```

Atributos: usar `getAtributosMap(personagem)` que já é genérico via `atributosHelper.js`, sem hardcodar nomes de atributos Lunaria.

### 5.2 `combatEngine.js` (websocket) — `iniciarCombate`

**Antes (linhas 97-128):** monta stats com fórmulas Lunaria hardcoded.
**Depois:**
```js
const engine = getEngine(sistema);
const combatState = engine.buildCombatState(p, p.bonusEquip);
jogadoresCombate[jUserId] = {
  personagemId: parseInt(pId),
  ...combatState,
  status: 'vivo',
  cooldowns: {},
};
```

**Iniciativa de monstros (linhas 148-161):**
```js
const engine = getEngine(sistema);
const inicConfig = engine.getIniciativaConfig(monstro);
const roll = Math.floor(Math.random() * inicConfig.lados) + 1;
iniciativaMonstros.push({
  ...monstro,
  iniciativa: roll + inicConfig.modificador,
});
```

**Solicitação de iniciativa ao jogador (linhas 213-227):**
O evento `combate_solicita_iniciativa` passa `atributo` e `lados` do `getIniciativaConfig`.

### 5.3 `combateHelper.js` — `resolverMecanicaCombate`

Manter como orquestrador. Extrair mecânica de ataque para despachar via engine:

```js
function _resolverAtaqueMecanico(sistema, atacanteStats, defensorStats, acao) {
  const engine = getEngine(sistema);
  return engine.resolverAtaque(atacanteStats, defensorStats, acao);
}
```

### 5.4 `economiaHelper.js`

```js
export const LIMITES_EQUIP = {
  arma: 1,
  armadura: 1,
  acessorio: 2,
  consumivel: 0,
  pergaminho: 0,
  mecha: 0,
};
```

### 5.5 `turnStateBuilder.js`

Já usa `calcularHPSistema`. Verificar que mana, ataque e defesa também despacham via `calcularManaSistema`, `calcularAtaqueSistema`, `calcularDefesaSistema` (já existem em `combateHelper.js`).

## 6. Regras do 3D&T no Combate (referência do manual)

- **FA (melee):** F + H + 1d6
- **FA (ranged):** PdF + H + 1d6
- **FD:** A + H + 1d6
- **Dano:** FA - FD (se positivo; 0 se negativo)
- **Iniciativa:** 1d6 + H
- **Crítico:** dado = 6 → dobra F/PdF na FA, ou A na FD
- **PV:** R × 5 (mínimo 1)
- **PM:** R × 5 (se tem vantagem Magia)
- **Arma +N:** soma +N em F ou PdF
- **Armadura +N:** soma +N em A
- **Arma Veloz:** H+2 apenas para iniciativa
- **Limite:** 1 arma mágica, 1 armadura mágica, 2 acessórios

## 7. O que NÃO muda

- Websocket: sessões, salas, turnos, emissão de eventos
- Redis: estado de sessão
- Narração: `mestreContextBuilder` já injeta regras certas
- Loot: distribuição pós-combate
- XP/level up
- Frontend: `InventarioPanel` já normaliza tresdet

## 8. Ordem de implementação

**Dependência:** steps 2 e 3 DEVEM completar antes do step 4 (senão Lunaria quebra).

1. Fix `LIMITES_EQUIP` — mecha (independente, trivial)
2. Expandir `game-systems/interface.js` com os novos métodos
3. Implementar novos métodos no tresdet engine + testes unitários
4. Implementar novos métodos no lunaria engine (wrap) + testes unitários
5. Stub D&D 5e com `throw new Error('Not implemented')`
6. Alterar `personagensHelper.js` para despachar inventário + bônus via engine/model
7. Alterar websocket `combatEngine.js` para usar `buildCombatState` + `getIniciativaConfig`
8. Alterar `combateHelper.js` para despachar `resolverAtaque` via engine
9. Teste integrado: sessão 3D&T → combate → verificar FA/FD/iniciativa
