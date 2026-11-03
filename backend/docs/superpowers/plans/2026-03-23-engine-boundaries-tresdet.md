# Engine Boundaries — 3D&T Combat Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o pipeline de combate delegar corretamente para o engine 3D&T, incluindo bônus de equipamento, cálculo FA/FD, iniciativa d6+H e consumíveis.

**Architecture:** Expandir a interface `GameEngine` com 4 novos métodos (`extrairBonusEquipamentos`, `buildCombatState`, `getIniciativaConfig`, `resolverConsumo`). Implementar no tresdet engine e wraps no lunaria engine. Alterar `personagensHelper`, websocket `combatEngine` e `combateHelper` para despachar via `getEngine(sistema)`.

**Tech Stack:** Node.js ESM, Prisma (PostgreSQL), Vitest

**Spec:** `backend/docs/superpowers/specs/2026-03-23-engine-boundaries-tresdet.md`

---

### Task 1: Fix LIMITES_EQUIP — adicionar mecha

**Files:**
- Modify: `backend/helpers/economiaHelper.js:70-76`
- Modify: `backend/tests/economiaHelper.test.js`

- [ ] **Step 1: Adicionar teste para tipo mecha**

Em `backend/tests/economiaHelper.test.js`, no bloco `describe('LIMITES_EQUIP')`:

```js
it('define limite para mecha', () => {
  expect(LIMITES_EQUIP.mecha).toBe(0);
});
```

- [ ] **Step 2: Rodar teste — deve falhar**

```bash
cd /opt/role-chat-game/backend && npx vitest run tests/economiaHelper.test.js
```

Expected: FAIL — `LIMITES_EQUIP.mecha` é `undefined`.

- [ ] **Step 3: Adicionar mecha ao LIMITES_EQUIP**

Em `backend/helpers/economiaHelper.js`, no objeto `LIMITES_EQUIP`:

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

- [ ] **Step 4: Rodar teste — deve passar**

```bash
cd /opt/role-chat-game/backend && npx vitest run tests/economiaHelper.test.js
```

- [ ] **Step 5: Commit**

```bash
cd /opt/role-chat-game/backend && git add helpers/economiaHelper.js tests/economiaHelper.test.js && git commit -m "fix(economia): add mecha to LIMITES_EQUIP

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Expandir interface GameEngine

**Files:**
- Modify: `backend/game-systems/interface.js`

- [ ] **Step 1: Adicionar novos typedefs e métodos à interface**

Adicionar ao final de `backend/game-systems/interface.js`:

```js
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
```

- [ ] **Step 2: Commit**

```bash
cd /opt/role-chat-game/backend && git add game-systems/interface.js && git commit -m "feat(engine): expand GameEngine interface with combat lifecycle methods

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Implementar extrairBonusEquipamentos no tresdet engine

**Files:**
- Create: `backend/game-systems/tresdet/equipmentEngine.js`
- Create: `backend/tests/tresdet-equipmentEngine.test.js`

- [ ] **Step 1: Escrever testes**

Criar `backend/tests/tresdet-equipmentEngine.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { extrairBonusEquipamentos } from '../game-systems/tresdet/equipmentEngine.js';

describe('tresdet extrairBonusEquipamentos', () => {
  it('retorna zeros para array vazio', () => {
    const result = extrairBonusEquipamentos([]);
    expect(result).toEqual({ F: 0, PdF: 0, A: 0, H: 0, iniciativa: 0, especiais: [] });
  });

  it('extrai bonus de Arma Mágica +1', () => {
    const itens = [{ nome: 'Arma Mágica: Bônus Mágico +1', tipo: 'arma' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.F).toBe(1);
    expect(result.PdF).toBe(1);
  });

  it('extrai bonus de Arma Mágica +3', () => {
    const itens = [{ nome: 'Arma Mágica: Bônus Mágico +3', tipo: 'arma' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.F).toBe(3);
    expect(result.PdF).toBe(3);
  });

  it('extrai bonus de Armadura Mágica +2', () => {
    const itens = [{ nome: 'Armadura Mágica: Bônus Mágico +2', tipo: 'armadura' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.A).toBe(2);
  });

  it('extrai bonus de Arma Veloz', () => {
    const itens = [{ nome: 'Arma Mágica: Veloz', tipo: 'arma' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.iniciativa).toBe(2);
  });

  it('extrai Flagelo como especial', () => {
    const itens = [{ nome: 'Arma Mágica: Flagelo (Humanos)', tipo: 'arma' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.especiais).toHaveLength(1);
    expect(result.especiais[0]).toEqual({ tipo: 'flagelo', alvo: 'Humanos', bonus: 1 });
  });

  it('extrai Armadura Extra como especial', () => {
    const itens = [{ nome: 'Armadura Mágica: Armadura Extra (Fogo)', tipo: 'armadura' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.especiais).toHaveLength(1);
    expect(result.especiais[0]).toEqual({ tipo: 'armadura_extra', elemento: 'Fogo' });
  });

  it('extrai Invulnerável como especial', () => {
    const itens = [{ nome: 'Armadura Mágica: Invulnerável (Frio)', tipo: 'armadura' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.especiais).toHaveLength(1);
    expect(result.especiais[0]).toEqual({ tipo: 'invulneravel', elemento: 'Frio' });
  });

  it('extrai Ataque Especial como especial', () => {
    const itens = [{ nome: 'Arma Mágica: Ataque Especial', tipo: 'arma' }];
    const result = extrairBonusEquipamentos(itens);
    expect(result.especiais).toHaveLength(1);
    expect(result.especiais[0]).toEqual({ tipo: 'ataque_especial', bonus: 2, usos: 1 });
  });

  it('agrega múltiplos itens', () => {
    const itens = [
      { nome: 'Arma Mágica: Bônus Mágico +2', tipo: 'arma' },
      { nome: 'Armadura Mágica: Bônus Mágico +1', tipo: 'armadura' },
      { nome: 'Arma Mágica: Veloz', tipo: 'arma' },
    ];
    const result = extrairBonusEquipamentos(itens);
    expect(result.F).toBe(2);
    expect(result.PdF).toBe(2);
    expect(result.A).toBe(1);
    expect(result.iniciativa).toBe(2);
  });

  it('ignora itens sem padrão reconhecido', () => {
    const itens = [
      { nome: 'Anel de Anulação', tipo: 'acessorio' },
      { nome: 'Medalhão de Arcanys', tipo: 'acessorio' },
    ];
    const result = extrairBonusEquipamentos(itens);
    expect(result.F).toBe(0);
    expect(result.A).toBe(0);
  });

  it('retorna zeros para input null/undefined', () => {
    expect(extrairBonusEquipamentos(null)).toEqual({ F: 0, PdF: 0, A: 0, H: 0, iniciativa: 0, especiais: [] });
    expect(extrairBonusEquipamentos(undefined)).toEqual({ F: 0, PdF: 0, A: 0, H: 0, iniciativa: 0, especiais: [] });
  });
});
```

- [ ] **Step 2: Rodar testes — devem falhar**

```bash
cd /opt/role-chat-game/backend && npx vitest run tests/tresdet-equipmentEngine.test.js
```

- [ ] **Step 3: Implementar equipmentEngine.js**

Criar `backend/game-systems/tresdet/equipmentEngine.js`:

```js
/**
 * Equipment bonus extraction for the 3D&T Alpha system.
 * Pure functions — no DB access, no side effects.
 *
 * Parses item names to extract mechanical bonuses.
 * 3D&T items don't have a structured `bonus` field — bonuses
 * are derived from the item name patterns defined in the manual.
 */

const EMPTY_BONUS = Object.freeze({ F: 0, PdF: 0, A: 0, H: 0, iniciativa: 0, especiais: [] });

const ARMA_BONUS_RE = /^Arma Mágica: Bônus Mágico \+(\d+)$/i;
const ARMADURA_BONUS_RE = /^Armadura Mágica: Bônus Mágico \+(\d+)$/i;
const ARMA_VELOZ_RE = /^Arma Mágica: Veloz$/i;
const ARMA_ATAQUE_ESPECIAL_RE = /^Arma Mágica: Ataque Especial$/i;
const FLAGELO_RE = /^Arma Mágica: Flagelo \((.+)\)$/i;
const ARMADURA_EXTRA_RE = /^Armadura Mágica: Armadura Extra \((.+)\)$/i;
const INVULNERAVEL_RE = /^Armadura Mágica: Invulnerável \((.+)\)$/i;

function extrairBonusItem(item) {
  const nome = item?.nome || '';
  let match;

  match = nome.match(ARMA_BONUS_RE);
  if (match) {
    const n = parseInt(match[1], 10);
    return { F: n, PdF: n };
  }

  match = nome.match(ARMADURA_BONUS_RE);
  if (match) {
    const n = parseInt(match[1], 10);
    return { A: n };
  }

  if (ARMA_VELOZ_RE.test(nome)) {
    return { iniciativa: 2 };
  }

  if (ARMA_ATAQUE_ESPECIAL_RE.test(nome)) {
    return { especial: { tipo: 'ataque_especial', bonus: 2, usos: 1 } };
  }

  match = nome.match(FLAGELO_RE);
  if (match) {
    return { especial: { tipo: 'flagelo', alvo: match[1], bonus: 1 } };
  }

  match = nome.match(ARMADURA_EXTRA_RE);
  if (match) {
    return { especial: { tipo: 'armadura_extra', elemento: match[1] } };
  }

  match = nome.match(INVULNERAVEL_RE);
  if (match) {
    return { especial: { tipo: 'invulneravel', elemento: match[1] } };
  }

  return null;
}

/**
 * Aggregate equipment bonuses from equipped 3D&T items.
 * @param {Object[]|null} itensEquipados
 * @returns {{ F: number, PdF: number, A: number, H: number, iniciativa: number, especiais: Object[] }}
 */
export function extrairBonusEquipamentos(itensEquipados) {
  if (!Array.isArray(itensEquipados)) return { ...EMPTY_BONUS, especiais: [] };

  const resultado = { F: 0, PdF: 0, A: 0, H: 0, iniciativa: 0, especiais: [] };

  for (const item of itensEquipados) {
    const bonus = extrairBonusItem(item);
    if (!bonus) continue;

    resultado.F += bonus.F || 0;
    resultado.PdF += bonus.PdF || 0;
    resultado.A += bonus.A || 0;
    resultado.H += bonus.H || 0;
    resultado.iniciativa += bonus.iniciativa || 0;

    if (bonus.especial) {
      resultado.especiais.push(bonus.especial);
    }
  }

  return resultado;
}
```

- [ ] **Step 4: Rodar testes — devem passar**

```bash
cd /opt/role-chat-game/backend && npx vitest run tests/tresdet-equipmentEngine.test.js
```

- [ ] **Step 5: Commit**

```bash
cd /opt/role-chat-game/backend && git add game-systems/tresdet/equipmentEngine.js tests/tresdet-equipmentEngine.test.js && git commit -m "feat(tresdet): equipment bonus extraction from item names

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Implementar buildCombatState, getIniciativaConfig, resolverConsumo no tresdet engine

**Files:**
- Modify: `backend/game-systems/tresdet/combatEngine.js`
- Modify: `backend/game-systems/tresdet/index.js`
- Create: `backend/tests/tresdet-combatState.test.js`

- [ ] **Step 1: Escrever testes**

Criar `backend/tests/tresdet-combatState.test.js`:

```js
import { describe, it, expect } from 'vitest';
import tresdetEngine from '../game-systems/tresdet/index.js';

describe('tresdet buildCombatState', () => {
  const personagem = {
    nome: 'Koltar',
    atributos_personagem: [
      { nome: 'F', valor: 3 },
      { nome: 'H', valor: 2 },
      { nome: 'R', valor: 2 },
      { nome: 'A', valor: 1 },
      { nome: 'PdF', valor: 0 },
    ],
    stats_sistema: { temMagia: false },
  };

  const bonusEquip = { F: 1, PdF: 0, A: 1, H: 0, iniciativa: 0, especiais: [] };

  it('calcula HP corretamente (R*5)', () => {
    const state = tresdetEngine.buildCombatState(personagem, bonusEquip);
    expect(state.hp_max).toBe(10); // R=2, 2*5=10
  });

  it('soma bonus de equip no ofensivo', () => {
    const state = tresdetEngine.buildCombatState(personagem, bonusEquip);
    expect(state.ofensivo.F).toBe(4); // F=3 + bonus=1
    expect(state.ofensivo.PdF).toBe(0);
    expect(state.ofensivo.H).toBe(2);
  });

  it('soma bonus de equip no defensivo', () => {
    const state = tresdetEngine.buildCombatState(personagem, bonusEquip);
    expect(state.defensivo.A).toBe(2); // A=1 + bonus=1
    expect(state.defensivo.H).toBe(2);
  });

  it('mana zero sem magia', () => {
    const state = tresdetEngine.buildCombatState(personagem, bonusEquip);
    expect(state.mana_max).toBe(0);
  });

  it('mana R*5 com magia', () => {
    const mago = { ...personagem, stats_sistema: { temMagia: true } };
    const state = tresdetEngine.buildCombatState(mago, bonusEquip);
    expect(state.mana_max).toBe(10);
  });

  it('retorna defaults para personagem null', () => {
    const state = tresdetEngine.buildCombatState(null, {});
    expect(state.hp_max).toBe(5);
    expect(state.personagemNome).toBe('Personagem');
  });
});

describe('tresdet getIniciativaConfig', () => {
  it('retorna d6 + H', () => {
    const personagem = {
      atributos_personagem: [{ nome: 'H', valor: 3 }],
    };
    const config = tresdetEngine.getIniciativaConfig(personagem);
    expect(config.atributo).toBe('Habilidade');
    expect(config.lados).toBe(6);
    expect(config.modificador).toBe(3);
  });

  it('soma bonus de iniciativa', () => {
    const personagem = {
      atributos_personagem: [{ nome: 'H', valor: 2 }],
      iniciativa_bonus: 2,
    };
    const config = tresdetEngine.getIniciativaConfig(personagem);
    expect(config.modificador).toBe(4); // H=2 + bonus=2
  });
});

describe('tresdet resolverConsumo', () => {
  it('parseia cura de PV', () => {
    const item = { efeito: 'Restaura 5 Pontos de Vida.' };
    const result = tresdetEngine.resolverConsumo({}, item);
    expect(result).toEqual([{ campo: 'hp', valor: 5, descricao: 'Restaura 5 Pontos de Vida' }]);
  });

  it('parseia cura total de PV', () => {
    const item = { efeito: 'Restaura todos os Pontos de Vida.' };
    const result = tresdetEngine.resolverConsumo({}, item);
    expect(result).toEqual([{ campo: 'hp', valor: 'max', descricao: 'Restaura todos os Pontos de Vida' }]);
  });

  it('parseia cura de PM', () => {
    const item = { efeito: 'Restaura 10 Pontos de Magia.' };
    const result = tresdetEngine.resolverConsumo({}, item);
    expect(result).toEqual([{ campo: 'mp', valor: 10, descricao: 'Restaura 10 Pontos de Magia' }]);
  });

  it('parseia cura dupla PV+PM', () => {
    const item = { efeito: 'Restaura 5 Pontos de Vida e 5 Pontos de Magia.' };
    const result = tresdetEngine.resolverConsumo({}, item);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ campo: 'hp', valor: 5, descricao: 'Restaura 5 Pontos de Vida' });
    expect(result[1]).toEqual({ campo: 'mp', valor: 5, descricao: 'Restaura 5 Pontos de Magia' });
  });

  it('parseia cura total dupla', () => {
    const item = { efeito: 'Restaura todos os Pontos de Vida e Pontos de Magia.' };
    const result = tresdetEngine.resolverConsumo({}, item);
    expect(result).toHaveLength(2);
    expect(result[0].campo).toBe('hp');
    expect(result[0].valor).toBe('max');
    expect(result[1].campo).toBe('mp');
    expect(result[1].valor).toBe('max');
  });

  it('retorna array vazio para efeito não reconhecido', () => {
    const item = { efeito: 'Cura venenos e doenças.' };
    const result = tresdetEngine.resolverConsumo({}, item);
    expect(result).toEqual([]);
  });
});

// resolverAtaque shape tests are in Task 8 (after critical rewrite)
```

- [ ] **Step 2: Rodar testes — devem falhar**

```bash
cd /opt/role-chat-game/backend && npx vitest run tests/tresdet-combatState.test.js
```

- [ ] **Step 3: Implementar buildCombatState, getIniciativaConfig, resolverConsumo em combatEngine.js**

Adicionar ao final de `backend/game-systems/tresdet/combatEngine.js`:

```js
/**
 * Build combat state for a 3D&T character.
 * @param {Object|null} personagemCompleto
 * @param {Object} bonusEquip - from extrairBonusEquipamentos
 * @returns {import('../interface.js').CombatState}
 */
export function buildCombatState(personagemCompleto, bonusEquip = {}) {
  if (!personagemCompleto) {
    return {
      hp_max: 5, hp_atual: 5,
      mana_max: 0, mana_atual: 0,
      ofensivo: { F: 1, PdF: 0, H: 1 },
      defensivo: { A: 1, H: 1 },
      iniciativa_bonus: 0,
      especiais: [],
      dano_base: null,
      elemento: null,
      personagemNome: 'Personagem',
    };
  }

  const hp_max = calcularHP(personagemCompleto);
  const mana_max = calcularMP(personagemCompleto);
  const F = getAtributo(personagemCompleto, 'F', 0) + (bonusEquip.F || 0);
  const PdF = getAtributo(personagemCompleto, 'PdF', 0) + (bonusEquip.PdF || 0);
  const H = getAtributo(personagemCompleto, 'H', 0) + (bonusEquip.H || 0);
  const A = getAtributo(personagemCompleto, 'A', 0) + (bonusEquip.A || 0);

  return {
    hp_max,
    hp_atual: personagemCompleto.hp_atual ?? hp_max,
    mana_max,
    mana_atual: personagemCompleto.mana_atual ?? mana_max,
    ofensivo: { F, PdF, H },
    defensivo: { A, H },
    iniciativa_bonus: bonusEquip.iniciativa || 0,
    especiais: bonusEquip.especiais || [],
    dano_base: null,
    elemento: null,
    personagemNome: personagemCompleto.nome || 'Personagem',
  };
}

/**
 * Initiative metadata for 3D&T: d6 + H.
 * @param {Object} personagem
 * @returns {import('../interface.js').IniciativaConfig}
 */
export function getIniciativaConfig(personagem) {
  const H = getAtributo(personagem, 'H', 0);
  const bonus = personagem?.iniciativa_bonus || 0;
  return {
    atributo: 'Habilidade',
    lados: 6,
    modificador: H + bonus,
  };
}

/**
 * Parse consumable item effect and return deltas.
 * Always returns an array.
 * @param {Object} _personagem - unused for now
 * @param {Object} item
 * @returns {import('../interface.js').ConsumoResultado[]}
 */
export function resolverConsumo(_personagem, item) {
  const efeito = item?.efeito || '';
  const resultados = [];

  // "Restaura todos os Pontos de Vida e Pontos de Magia"
  if (/restaura todos os pontos de vida e (?:pontos de )?magia/i.test(efeito)) {
    resultados.push({ campo: 'hp', valor: 'max', descricao: 'Restaura todos os Pontos de Vida' });
    resultados.push({ campo: 'mp', valor: 'max', descricao: 'Restaura todos os Pontos de Magia' });
    return resultados;
  }

  // "Restaura N Pontos de Vida e N Pontos de Magia"
  const dualMatch = efeito.match(/restaura (\d+) pontos de vida e (\d+) pontos de magia/i);
  if (dualMatch) {
    resultados.push({ campo: 'hp', valor: parseInt(dualMatch[1], 10), descricao: `Restaura ${dualMatch[1]} Pontos de Vida` });
    resultados.push({ campo: 'mp', valor: parseInt(dualMatch[2], 10), descricao: `Restaura ${dualMatch[2]} Pontos de Magia` });
    return resultados;
  }

  // "Restaura todos os Pontos de Vida"
  if (/restaura todos os pontos de vida/i.test(efeito)) {
    resultados.push({ campo: 'hp', valor: 'max', descricao: 'Restaura todos os Pontos de Vida' });
    return resultados;
  }

  // "Restaura todos os Pontos de Magia" / "restaura todos os PMs"
  if (/restaura todos os pontos de magia/i.test(efeito) || /restaura todos os pms/i.test(efeito)) {
    resultados.push({ campo: 'mp', valor: 'max', descricao: 'Restaura todos os Pontos de Magia' });
    return resultados;
  }

  // "Restaura N Pontos de Vida"
  const pvMatch = efeito.match(/restaura (\d+) pontos de vida/i);
  if (pvMatch) {
    resultados.push({ campo: 'hp', valor: parseInt(pvMatch[1], 10), descricao: `Restaura ${pvMatch[1]} Pontos de Vida` });
  }

  // "Restaura N Pontos de Magia"
  const pmMatch = efeito.match(/restaura (\d+) pontos de magia/i);
  if (pmMatch) {
    resultados.push({ campo: 'mp', valor: parseInt(pmMatch[1], 10), descricao: `Restaura ${pmMatch[1]} Pontos de Magia` });
  }

  return resultados;
}
```

Nota: os imports de `calcularHP`, `calcularMP` e `getAtributo` já existem no arquivo ou precisam ser adicionados no topo.

- [ ] **Step 4: Adicionar imports necessários em combatEngine.js**

No topo de `backend/game-systems/tresdet/combatEngine.js`, garantir que existam:

```js
import { getAtributo } from '../../helpers/atributosHelper.js';
import { calcularHP, calcularMP } from './characterEngine.js';
```

(`getAtributo` já está importado; adicionar `calcularHP` e `calcularMP` do characterEngine.)

- [ ] **Step 5: Registrar novos métodos no index.js do tresdet**

Em `backend/game-systems/tresdet/index.js`, adicionar imports e métodos ao engine:

```js
import {
  resolverAtaque,
  calcularIniciativa,
  buildCombatState,
  getIniciativaConfig,
  resolverConsumo,
} from './combatEngine.js';

import { extrairBonusEquipamentos } from './equipmentEngine.js';
```

E no objeto `tresdetEngine`:

```js
const tresdetEngine = {
  resolverAtaque,
  calcularIniciativa,
  resolverTeste,
  calcularHP,
  calcularMP,
  calcularAtaque,
  calcularDefesa,
  getAtributosBase,
  getProgressaoNivel,
  getWizardStages,
  validarCriacao,
  getRegrasMestrePrompt,
  // v2
  extrairBonusEquipamentos,
  buildCombatState,
  getIniciativaConfig,
  resolverConsumo,
};
```

- [ ] **Step 6: Rodar testes — devem passar**

```bash
cd /opt/role-chat-game/backend && npx vitest run tests/tresdet-combatState.test.js tests/tresdet-equipmentEngine.test.js
```

- [ ] **Step 7: Commit**

```bash
cd /opt/role-chat-game/backend && git add game-systems/tresdet/combatEngine.js game-systems/tresdet/equipmentEngine.js game-systems/tresdet/index.js tests/tresdet-combatState.test.js && git commit -m "feat(tresdet): buildCombatState, getIniciativaConfig, resolverConsumo

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Implementar wraps no lunaria engine + stub D&D5e

**Files:**
- Modify: `backend/game-systems/lunaria/combatEngine.js`
- Modify: `backend/game-systems/lunaria/index.js`
- Modify: `backend/game-systems/dnd5e/index.js`
- Create: `backend/tests/lunaria-engineV2.test.js`

- [ ] **Step 1: Escrever testes para lunaria wraps**

Criar `backend/tests/lunaria-engineV2.test.js`:

```js
import { describe, it, expect } from 'vitest';
import lunariaEngine from '../game-systems/lunaria/index.js';

describe('lunaria extrairBonusEquipamentos', () => {
  it('agrega bonus de equipamentos Lunaria', () => {
    const equipamentos = [
      { bonus: { ataque: 2, dano: 1, armadura: 0 } },
      { bonus: { ataque: 0, dano: 0, armadura: 3 } },
    ];
    const result = lunariaEngine.extrairBonusEquipamentos(equipamentos);
    expect(result.ataque).toBe(2);
    expect(result.dano).toBe(1);
    expect(result.armadura).toBe(3);
  });

  it('retorna zeros para array vazio', () => {
    const result = lunariaEngine.extrairBonusEquipamentos([]);
    expect(result.ataque).toBe(0);
  });
});

describe('lunaria buildCombatState', () => {
  it('retorna state com esquiva e armadura', () => {
    const personagem = {
      nome: 'Aria',
      atributos: { constituicao: 14, destreza: 12, agilidade: 10, inteligencia: 10, carisma: 10 },
      nivel: 1,
      raca_nome: 'Humano',
    };
    const bonusEquip = { ataque: 1, dano: 0, armadura: 2, esquiva_bonus: 0, esquiva_penalidade: 0 };
    const state = lunariaEngine.buildCombatState(personagem, bonusEquip);
    expect(state).toHaveProperty('hp_max');
    expect(state).toHaveProperty('personagemNome', 'Aria');
    expect(state.armadura).toBe(2);
  });

  it('retorna defaults para personagem null', () => {
    const state = lunariaEngine.buildCombatState(null, {});
    expect(state.hp_max).toBe(15);
    expect(state.personagemNome).toBe('Jogador');
  });
});

describe('lunaria getIniciativaConfig', () => {
  it('retorna d20 + agilidade modifier', () => {
    const personagem = { atributos: { agilidade: 14 } };
    const config = lunariaEngine.getIniciativaConfig(personagem);
    expect(config.atributo).toBe('Agilidade');
    expect(config.lados).toBe(20);
    expect(config.modificador).toBe(2); // floor((14-10)/2)
  });
});

describe('lunaria resolverConsumo', () => {
  it('retorna array vazio (não implementado)', () => {
    const result = lunariaEngine.resolverConsumo({}, { efeito: 'teste' });
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar testes — devem falhar**

```bash
cd /opt/role-chat-game/backend && npx vitest run tests/lunaria-engineV2.test.js
```

- [ ] **Step 3: Implementar wraps no lunaria combatEngine.js**

Adicionar ao final de `backend/game-systems/lunaria/combatEngine.js`:

```js
import { agregarBonusEquipamentos } from '../../helpers/bonusHelper.js';
import { calcularHP, calcularMana, calcularEsquiva, calcularArmadura, getMultRaca } from '../../helpers/combateHelper.js';

/**
 * Wrap of agregarBonusEquipamentos for the Lunaria engine.
 */
export function extrairBonusEquipamentos(itensEquipados) {
  return agregarBonusEquipamentos(itensEquipados);
}

/**
 * Build combat state for a Lunaria character.
 * Replicates the logic from websocket combatEngine.js lines 97-128.
 */
export function buildCombatState(personagemCompleto, bonusEquip = {}) {
  if (!personagemCompleto) {
    return {
      hp_max: 15, hp_atual: 15,
      mana_max: 10, mana_atual: 10,
      esquiva: 5, armadura: 0,
      bonusAtaque: 0, bonusDano: 0,
      dano_base: '1d6-1', elemento: null,
      personagemNome: 'Jogador',
    };
  }

  const attrs = personagemCompleto.atributos || {};
  const personagemStats = {
    constituicao: attrs.constituicao || 10,
    destreza: attrs.destreza || 10,
    agilidade: attrs.agilidade || 10,
    nivel: personagemCompleto.nivel || 1,
  };
  const multRaca = getMultRaca(personagemCompleto.raca_nome || personagemCompleto.raca || '');
  const hpMax = calcularHP(personagemStats, multRaca);
  const manaMax = calcularMana({
    inteligencia: attrs.inteligencia || 10,
    carisma: attrs.carisma || 10,
    nivel: personagemCompleto.nivel || 1,
  });

  return {
    hp_max: hpMax,
    hp_atual: personagemCompleto.hp_atual ?? hpMax,
    mana_max: manaMax,
    mana_atual: personagemCompleto.mana_atual ?? manaMax,
    esquiva: calcularEsquiva(personagemStats, bonusEquip),
    armadura: calcularArmadura(bonusEquip),
    bonusAtaque: Math.floor(((attrs.destreza || 10) - 10) / 2) + (bonusEquip.ataque || 0),
    bonusDano: bonusEquip.dano || 0,
    dano_base: personagemCompleto.melhorArma || (personagemCompleto.equipamentos?.length > 0 ? '1d6' : '1d6-1'),
    elemento: personagemCompleto.elementoArma || null,
    personagemNome: personagemCompleto.nome || 'Jogador',
  };
}

/**
 * Initiative metadata for Lunaria: d20 + agilidade modifier.
 */
export function getIniciativaConfig(personagem) {
  const attrs = personagem?.atributos || personagem || {};
  const agilidade = attrs.agilidade || 10;
  return {
    atributo: 'Agilidade',
    lados: 20,
    modificador: Math.floor((agilidade - 10) / 2),
  };
}

/**
 * Consumable resolution for Lunaria — not yet implemented.
 */
export function resolverConsumo() {
  return [];
}
```

- [ ] **Step 4: Registrar novos métodos no lunaria index.js**

Em `backend/game-systems/lunaria/index.js`, adicionar imports e registrar:

```js
import {
  resolverAtaque,
  calcularIniciativa,
  resolverTeste,
  extrairBonusEquipamentos,
  buildCombatState,
  getIniciativaConfig,
  resolverConsumo,
} from './combatEngine.js';
```

E no objeto `lunariaEngine`, adicionar:

```js
  extrairBonusEquipamentos,
  buildCombatState,
  getIniciativaConfig,
  resolverConsumo,
```

- [ ] **Step 5: Stub D&D5e**

Em `backend/game-systems/dnd5e/index.js`, adicionar ao objeto engine:

```js
  extrairBonusEquipamentos: () => { throw new Error('Not implemented: dnd5e.extrairBonusEquipamentos'); },
  buildCombatState: () => { throw new Error('Not implemented: dnd5e.buildCombatState'); },
  getIniciativaConfig: () => { throw new Error('Not implemented: dnd5e.getIniciativaConfig'); },
  resolverConsumo: () => { throw new Error('Not implemented: dnd5e.resolverConsumo'); },
```

- [ ] **Step 6: Rodar testes — devem passar**

```bash
cd /opt/role-chat-game/backend && npx vitest run tests/lunaria-engineV2.test.js
```

- [ ] **Step 7: Rodar todos os testes existentes — nenhum deve quebrar**

```bash
cd /opt/role-chat-game/backend && npx vitest run
```

- [ ] **Step 8: Commit**

```bash
cd /opt/role-chat-game/backend && git add game-systems/lunaria/combatEngine.js game-systems/lunaria/index.js game-systems/dnd5e/index.js tests/lunaria-engineV2.test.js && git commit -m "feat(lunaria): wrap existing functions into v2 engine interface, stub dnd5e

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Alterar personagensHelper para despachar inventário via sistema

**Files:**
- Modify: `backend/helpers/personagensHelper.js:40-86`

- [ ] **Step 1: Adicionar import do getEngine**

No topo de `backend/helpers/personagensHelper.js`:

```js
import { getEngine } from '../game-systems/index.js';
```

- [ ] **Step 2: Substituir carregamento de equipamentos**

Na função `buscarPersonagensCompletos`, substituir o bloco de equipamentos (linhas ~41-86) para despachar por sistema:

```js
// Inventário: despacha para tabela correta por sistema
const sistema = personagem.sistema || 'lunaria';
const engine = getEngine(sistema);
let itensEquipados;

if (sistema === 'tresdet') {
  const inv = await db.PersonagemItemTresDet.listarInventario(personagem.id);
  const equipadosRaw = inv.filter(e => e.equipado);
  itensEquipados = equipadosRaw.map(e => e.item);
} else {
  const equipamentos = await db.Personagem.listarEquipamentos(personagem.id);
  itensEquipados = equipamentos.map(e => ({
    nome: e.equipamento?.nome || e.nome,
    tipo: e.equipamento?.tipo || e.tipo,
    descricao: e.equipamento?.descricao || e.descricao,
    dano_base: e.equipamento?.dano_base || e.dano_base || null,
    bonus: e.equipamento?.bonus || e.bonus || null,
    requisitos: normalizarRequisitos(e.equipamento?.requisitos || e.requisitos || null),
    efeito: normalizarEfeitoCatalogo(e.equipamento?.efeito || e.efeito || null),
    elemento: normalizarListaElementos(e.equipamento?.elemento || e.elemento) || [],
  }));
}

const bonusEquip = engine.extrairBonusEquipamentos(itensEquipados);
const melhorArma = sistema === 'tresdet' ? null : encontrarMelhorArma(itensEquipados);
```

O restante do retorno (`personagemCompleto`) mantém `bonusEquip`, `melhorArma`, `equipamentos: itensEquipados`.

- [ ] **Step 3: Rodar todos os testes — nenhum deve quebrar**

```bash
cd /opt/role-chat-game/backend && npx vitest run
```

- [ ] **Step 4: Commit**

```bash
cd /opt/role-chat-game/backend && git add helpers/personagensHelper.js && git commit -m "feat(personagens): dispatch inventory loading by sistema via engine

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Alterar websocket combatEngine para usar buildCombatState e getIniciativaConfig

**Files:**
- Modify: `backend/websocket/engines/combatEngine.js:47-160`

- [ ] **Step 1: Adicionar import do getEngine**

No topo de `backend/websocket/engines/combatEngine.js`:

```js
import { getEngine } from '../../game-systems/index.js';
```

- [ ] **Step 2: Substituir montagem de stats de jogadores (linhas ~97-128)**

Substituir o bloco `if (p) { ... }` por:

```js
if (p) {
  const engine = getEngine(sistema);
  const combatState = engine.buildCombatState(p, p.bonusEquip || {});
  jogadoresCombate[jUserId] = {
    personagemId: parseInt(pId),
    ...combatState,
    hp_atual: (() => {
      const hpNarrativo = Number.isFinite(Number(p.hp_atual)) ? Number(p.hp_atual) : null;
      return (hpNarrativo != null && hpNarrativo < combatState.hp_max) ? Math.max(0, hpNarrativo) : combatState.hp_max;
    })(),
    mana_atual: (p.mana_atual != null && p.mana_atual < combatState.mana_max) ? p.mana_atual : combatState.mana_max,
    status: 'vivo',
    cooldowns: {},
  };
}
```

O bloco `else` (fallback) já retorna defaults; delegar ao engine:

```js
else {
  const engine = getEngine(sistema);
  jogadoresCombate[jUserId] = {
    personagemId: parseInt(pId) || null,
    ...engine.buildCombatState(null, {}),
    status: 'vivo',
    cooldowns: {},
  };
}
```

- [ ] **Step 3: Substituir iniciativa de monstros (linhas ~148-161)**

```js
const engine = getEngine(sistema);
for (const monstro of instancias) {
  const inicConfig = engine.getIniciativaConfig(monstro);
  const roll = Math.floor(Math.random() * inicConfig.lados) + 1;
  iniciativaMonstros.push({
    ...monstro,
    iniciativa: roll + inicConfig.modificador,
  });
}
```

- [ ] **Step 4: Rodar todos os testes**

```bash
cd /opt/role-chat-game/backend && npx vitest run
```

- [ ] **Step 5: Commit**

```bash
cd /opt/role-chat-game/backend && git add websocket/engines/combatEngine.js && git commit -m "feat(combat): delegate state building and initiative to game engine

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Adicionar crítico ao resolverAtaque do tresdet + shape unificado

**Files:**
- Modify: `backend/game-systems/tresdet/combatEngine.js:25-52`
- Modify: `backend/tests/tresdet-combatState.test.js`

- [ ] **Step 1: Adicionar testes de shape e crítico**

Em `backend/tests/tresdet-combatState.test.js`, adicionar:

```js
describe('tresdet resolverAtaque', () => {
  const atacante = { atributos_personagem: [{ nome: 'F', valor: 3 }, { nome: 'H', valor: 2 }] };
  const defensor = { atributos_personagem: [{ nome: 'A', valor: 1 }, { nome: 'H', valor: 1 }] };

  it('retorna shape unificado com campo dados', () => {
    const result = tresdetEngine.resolverAtaque(atacante, defensor, {});
    expect(result).toHaveProperty('acertou');
    expect(result).toHaveProperty('dano');
    expect(result).toHaveProperty('critico');
    expect(result).toHaveProperty('detalhes');
    expect(result).toHaveProperty('dados');
    expect(typeof result.detalhes).toBe('string');
    expect(result.dados).toHaveProperty('FA');
    expect(result.dados).toHaveProperty('FD');
  });
});
```

- [ ] **Step 2: Implementar crítico no resolverAtaque**

Em `backend/game-systems/tresdet/combatEngine.js`, substituir `resolverAtaque`:

```js
export function resolverAtaque(atacante, defensor, acao = {}) {
  const isRanged = acao.tipo === 'ranged' || acao.alcance === 'distancia';

  const attrAtaque = isRanged ? 'PdF' : 'F';
  const valorAtaque = getAtributo(atacante, attrAtaque, 0);
  const hAtacante = getAtributo(atacante, 'H', 0);
  const dadoAtaque = rolarD6();
  const criticoAtaque = dadoAtaque === 6;
  const valorAtaqueEfetivo = criticoAtaque ? valorAtaque * 2 : valorAtaque;
  const FA = valorAtaqueEfetivo + hAtacante + dadoAtaque;

  const aDefensor = getAtributo(defensor, 'A', 0);
  const hDefensor = getAtributo(defensor, 'H', 0);
  const dadoDefesa = rolarD6();
  const criticoDefesa = dadoDefesa === 6;
  const aDefensorEfetivo = criticoDefesa ? aDefensor * 2 : aDefensor;
  const FD = aDefensorEfetivo + hDefensor + dadoDefesa;

  const dano = Math.max(0, FA - FD);
  const acertou = dano > 0;

  return {
    acertou,
    dano,
    critico: criticoAtaque,
    detalhes: `FA: ${attrAtaque}(${valorAtaque}${criticoAtaque ? 'x2' : ''})+H(${hAtacante})+d6(${dadoAtaque})=${FA} vs FD: A(${aDefensor}${criticoDefesa ? 'x2' : ''})+H(${hDefensor})+d6(${dadoDefesa})=${FD} → Dano: ${dano}`,
    dados: { FA, FD, dadoAtaque, dadoDefesa, criticoAtaque, criticoDefesa },
  };
}
```

- [ ] **Step 3: Rodar testes**

```bash
cd /opt/role-chat-game/backend && npx vitest run tests/tresdet-combatState.test.js tests/tresdet-equipmentEngine.test.js
```

- [ ] **Step 4: Commit**

```bash
cd /opt/role-chat-game/backend && git add game-systems/tresdet/combatEngine.js tests/tresdet-combatState.test.js && git commit -m "feat(tresdet): add critical detection (dado=6 doubles F/PdF or A)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Dispatcher resolverAtaque no combateHelper (Spec 5.3)

**Files:**
- Modify: `backend/helpers/combateHelper.js`

O `resolverMecanicaCombate` chama `_resolverAtaque` que usa mecânicas Lunaria (d20+DC). Precisamos que ele despache para o engine correto quando o sistema for tresdet.

- [ ] **Step 1: Adicionar import de getEngine no combateHelper.js**

Verificar que `import { getEngine } from '../game-systems/index.js';` já existe (linha 29). Se não, adicionar.

- [ ] **Step 2: Modificar _resolverAtaque para despachar por sistema**

Na função `_resolverAtaque` (linha ~1014), adicionar check de sistema no início:

```js
function _resolverAtaque(combate, userId, sessao, personagem, jogadorStats, statusEfeitos, combatIntent = null) {
  const sistema = sessao?.sistema || 'lunaria';

  // Para sistemas não-Lunaria, delegar ao engine do sistema
  if (sistema !== 'lunaria') {
    return _resolverAtaqueSistema(sistema, combate, userId, jogadorStats, combatIntent);
  }

  // ... resto da implementação Lunaria existente permanece inalterado ...
}
```

- [ ] **Step 3: Criar função _resolverAtaqueSistema**

Adicionar após `_resolverAtaque`:

```js
function _resolverAtaqueSistema(sistema, combate, userId, jogadorStats, combatIntent) {
  const engine = getEngine(sistema);
  const alvoId = combatIntent?.alvoId;
  const monstroAlvo = (alvoId && combate.monstros.find(m => m.id === alvoId && m.status === 'vivo'))
    || combate.monstros.find(m => m.status === 'vivo');
  if (!monstroAlvo) return null;

  const resultado = engine.resolverAtaque(jogadorStats, monstroAlvo, combatIntent || {});

  return {
    ataque: resultado,
    monstroAlvo,
    acaoConsumida: true,
  };
}
```

Nota: a integração completa com o pipeline de teste/dano do combateHelper pode precisar de ajustes adicionais dependendo de como `resolverMecanicaCombate` processa o resultado. Esta task estabelece o dispatcher; refinamentos podem ser necessários.

- [ ] **Step 4: Rodar testes existentes**

```bash
cd /opt/role-chat-game/backend && npx vitest run tests/combateHelper.test.js
```

- [ ] **Step 5: Commit**

```bash
cd /opt/role-chat-game/backend && git add helpers/combateHelper.js && git commit -m "feat(combat): dispatch resolverAtaque via game engine for non-Lunaria systems

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Player initiative solicitation no websocket combatEngine

**Files:**
- Modify: `backend/websocket/engines/combatEngine.js:213-227`

- [ ] **Step 1: Localizar o bloco de solicitação de iniciativa ao jogador**

Buscar onde `combate_solicita_iniciativa` é emitido com `atributo: 'Agilidade'` hardcoded.

- [ ] **Step 2: Substituir por getIniciativaConfig**

```js
const engine = getEngine(sistema);
// Para cada jogador:
const inicConfig = engine.getIniciativaConfig(p || {});
// No evento combate_solicita_iniciativa:
// atributo: inicConfig.atributo,
// modificador: inicConfig.modificador,
// lados: inicConfig.lados,
```

- [ ] **Step 3: Rodar testes**

```bash
cd /opt/role-chat-game/backend && npx vitest run
```

- [ ] **Step 4: Commit**

```bash
cd /opt/role-chat-game/backend && git add websocket/engines/combatEngine.js && git commit -m "feat(combat): delegate player initiative config to game engine

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Verificar turnStateBuilder (Spec 5.5)

**Files:**
- Read: `backend/helpers/turnStateBuilder.js`

- [ ] **Step 1: Verificar dispatchers existentes**

Ler `turnStateBuilder.js` e confirmar que:
- `calcularHPSistema` é usado (já confirmado)
- `calcularManaSistema` é usado
- Verificar se `calcularAtaqueSistema` e `calcularDefesaSistema` são usados (provavelmente não — o turnStateBuilder é para contexto da IA, não para combate mecânico)

- [ ] **Step 2: Se necessário, adicionar dispatchers faltantes**

Se o turnStateBuilder mostrar stats de ataque/defesa para a IA e usar fórmulas Lunaria hardcoded, substituir por `calcularAtaqueSistema`/`calcularDefesaSistema`.

- [ ] **Step 3: Commit se houve mudança**

```bash
cd /opt/role-chat-game/backend && git add helpers/turnStateBuilder.js && git commit -m "fix(turnState): ensure system-aware stat dispatchers

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Rodar suite completa e verificar

**Files:** nenhum novo

- [ ] **Step 1: Rodar todos os testes**

```bash
cd /opt/role-chat-game/backend && npx vitest run
```

Todos os testes existentes + novos devem passar. Se algum teste falhar, investigar e corrigir antes de prosseguir.

- [ ] **Step 2: Verificar que o servidor inicia sem erros**

```bash
cd /opt/role-chat-game/backend && timeout 10 node server.js 2>&1 || true
```

Verificar que não há erros de import ou referência.
