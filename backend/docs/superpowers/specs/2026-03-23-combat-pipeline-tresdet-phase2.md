# Spec: Combat Pipeline 3D&T — Phase 2 (Monster Turns + Attack Resolution)

**Data:** 2026-03-23
**Status:** Aprovado
**Versão:** 1.0
**Complementa:** `2026-03-23-engine-boundaries-tresdet.md`

---

## 1. Problema

A Phase 1 corrigiu o setup de combate (stats, iniciativa, bonus de equip) mas a **resolução de ataques** ainda usa fórmulas Lunaria:

1. **`executarTurnoMonstro`** (websocket combatEngine.js:455-492) — monstros atacam com d20+destreza+forca, absorção CON. 3D&T usa FA vs FD, sem absorção.
2. **`_resolverAtaqueSistema`** (combateHelper.js:1048-1060) — retorna shape incompatível com o pipeline. O caller espera `{ requerTeste }` mas recebe `{ ataque, monstroAlvo }`.
3. **`_resolverDefesa`** (combateHelper.js:1068-1084) — +2DC é conceito Lunaria. 3D&T não tem ação de defesa separada.
4. **Absorção** (combateHelper.js:1642-1644, combatEngine.js:490-492) — `calcularAbsorcao` é Lunaria only. 3D&T: dano = FA-FD direto.

## 2. Princípio

**Monstros e jogadores no 3D&T resolvem tudo em um passo: FA vs FD → dano.**

Não existe fase de teste (d20 vs DC), absorção, nem ação de defesa separada. O `engine.resolverAtaque()` já implementa tudo isso. O pipeline deve pular as etapas Lunaria-only.

## 3. Mudanças

### 3.1 `executarTurnoMonstro` — dispatch por sistema

No início do método, após encontrar monstro e alvo vivo:

```js
if (sistema !== 'lunaria') {
  const engine = getEngine(sistema);
  const resultado = engine.resolverAtaque(monstro, alvoStats, {});

  if (resultado.acertou) {
    alvoStats.hp_atual = Math.max(0, alvoStats.hp_atual - resultado.dano);
    if (alvoStats.hp_atual <= 0) alvoStats.status = 'inconsciente';
  }

  // Retornar resultado no shape esperado pelo event emitter
  return { atacanteId, atacanteNome, alvoId, alvoNome, ...resultado, hpRestante, hpMax };
}
// ... path Lunaria inalterado ...
```

Sem absorção, sem DC esquiva, sem d20. O `resolverAtaque` do tresdet engine já calcula FA vs FD com crítico.

### 3.2 `_resolverAtaqueSistema` — resultado direto sem fase de teste

O 3D&T não tem fase de teste separada (rolar d20 → ver se acertou → rolar dano). Tudo acontece em `resolverAtaque`. O dispatcher deve:

1. Resolver o ataque via engine
2. Aplicar dano ao monstro diretamente
3. Retornar resultado marcando `acaoConsumida: true` e `ataqueSistema: true` (flag para o pipeline pular absorção)

```js
function _resolverAtaqueSistema(sistema, combate, userId, jogadorStats, combatIntent) {
  const engine = getEngine(sistema);
  const monstroAlvo = encontrarAlvo(combate, combatIntent);
  if (!monstroAlvo) return null;

  const resultado = engine.resolverAtaque(jogadorStats, monstroAlvo, combatIntent || {});

  // Aplicar dano direto (sem fase de teste)
  if (resultado.acertou) {
    monstroAlvo.hp = Math.max(0, (monstroAlvo.hp || monstroAlvo.hp_atual || 0) - resultado.dano);
    if (monstroAlvo.hp <= 0) monstroAlvo.status = 'derrotado';
  }

  return {
    acaoConsumida: true,
    ataqueSistema: true,
    resultado,
    monstroAlvo,
    personagemNome: jogadorStats.personagemNome,
  };
}
```

### 3.3 `_resolverDefesa` — no-op para non-Lunaria

```js
function _resolverDefesa(combate, userId, personagem, jogadorStats) {
  const sistema = /* extrair de combate ou contexto */;
  if (sistema !== 'lunaria') {
    // 3D&T não tem ação de defesa separada
    return null;
  }
  // ... path Lunaria inalterado ...
}
```

### 3.4 Absorção — skip para non-Lunaria

Em `finalizarAcaoCombatePosTeste` (combateHelper.js:1642-1644):
```js
if (sistema === 'lunaria') {
  absorcao = calcularAbsorcao(constituicao, armadura);
  dano = Math.max(0, dano - absorcao);
}
```

## 4. O que NÃO muda
- Toda a mecânica Lunaria (intacta)
- Loot, XP, fim de combate
- Turno/rodada orchestration
- Frontend
- Engine tresdet (já pronto na Phase 1)

## 5. Ordem de implementação
1. `executarTurnoMonstro` — dispatch por sistema
2. `_resolverAtaqueSistema` — resultado direto com dano aplicado
3. `_resolverDefesa` — no-op para non-Lunaria
4. Absorção — skip para non-Lunaria
5. Testes + verificação
