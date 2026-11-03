# Auditoria de Integridade do Jogo — Regras, Pipeline, Frontend

**Data:** 2026-03-17 | **Método:** 5 agentes com análise profunda (~9K linhas de código)

---

## RESUMO EXECUTIVO

| Área | Score | Achados críticos |
|------|:-----:|-----------------|
| Regras prompt vs mecânica backend | **9/10** | 16/18 MATCH, 1 MISMATCH (pontos atributo), 2 PARCIAL |
| Pipeline de ações (21 tipos) | **8.5/10** | 21/21 cobertos, 1 bug médio (curar em TARGET_ACTIONS) |
| Fluxo de combate E2E | **7/10** | Monstros acertam 95% sem check defesa, decremento duplo de status, concentração não quebra ao receber dano |
| Estado do turno → LLM | **9.5/10** | Todos os campos renderizados, passivasAplicaveis funcional |
| Emissão frontend (WebSocket) | **8/10** | 20+ eventos completos, `gancho` ausente no turnEngine |
| Contexto + memória + roteiro | **7/10** | Rename "(NPC)" não propaga, duplicação de personagens, status NPC perdido no resumo |

---

## BUGS E GAPS POR SEVERIDADE

### ALTA

| # | Bug | Arquivo:Linha | Impacto |
|---|-----|--------------|---------|
| 1 | **Decremento DUPLO de status effects em jogadores durante combate** — effectManager decrementa no início do turno E `_controlarRodada` decrementa de novo quando a rodada avança. Efeitos duram METADE do esperado. | `masterNarrationEngine.js:954` + `combateHelper.js:965` | Buffs/debuffs expiram prematuramente |
| 2 | **`checkDanoConcentracao` definido mas NUNCA invocado** — quando jogador recebe dano em contra-ataque, concentração deveria ser testada (DC = max(10, dano/2)) mas o teste nunca é chamado | `concentrationManager.js:69` / `combateHelper.js:_executarContraAtaques` | Magias de concentração nunca quebram por dano |
| 3 | **Rename "(NPC)" não propaga para contexto persistente** — `npcsPresentes`/`npcsEncontrados` no `formatMestreContextBlocks`, `normalizeNpcList`, resumo e histórico usam nome original. LLM vê "Aldric (NPC)" no blueprint mas "Aldric" no contexto | `mestreContextBuilder.js:462,596-612` | Confusão PJ/NPC persiste parcialmente |
| 4 | **`gancho` ausente no início de turno** — `turnEngine.js:755-760` não inclui `gancho` no payload de `mensagem_mestre`. Campo só aparece via `masterNarrationEngine` | `turnEngine.js:755-760` | Frontend não recebe gancho na abertura de turno |

### MÉDIA

| # | Bug | Arquivo:Linha | Impacto |
|---|-----|--------------|---------|
| 5 | **Monstros SEMPRE acertam (95%)** — `verificarAcerto` chamado sem `total` e `defesaAlvo` no contra-ataque, retorna `acertou: true` por default. `monstro.ataque` é calculado mas nunca usado | `combateHelper.js:904` | Combate mais difícil que deveria; defesa do jogador (exceto esquiva) é ignorada |
| 6 | **`curar` em TARGET_ACTIONS pode inverter auto-cura** — `corrigirDirecionalidade` troca personagem=jogador para monstro em ações de TARGET. Quando jogador cura a si mesmo em combate, a correção substitui erroneamente | `acoesProcessor.js:164` | Auto-cura pode ser aplicada no monstro |
| 7 | **MISMATCH pontos de atributo** — prompt diz "+1 por level up", backend dá +2 a cada nível ímpar (3,5,7...) e 0 nos pares | `evolucaoHelper.js:49-52` vs `sistema.js:248` | LLM narra "+1 ponto" quando backend dá 0 ou 2 |
| 8 | **Status de NPC perdido no resumo** — `extractSummarySignals` extrai apenas nome, não status (aliado/hostil/morto). `relacoesNPC` nunca é populado | `mestreContextBuilder.js:722-723` | NPCs mortos podem reaparecer; relações se perdem |
| 9 | **Duplicação de info de personagens** — `partyResumo` no contexto persistente repete nome/raça/classe/nível/background já presentes em `montarPersonagens4Pilares` | `sistema.js:751` vs `mestreContextBuilder.js:538-543` | ~300-800 tokens desperdiçados |
| 10 | **`buildMemoriaEvictadaAviso` muta sessão** — side-effect em função de leitura; chamadas múltiplas decrementam contador extra | `mestreInvocationContext.js:229-241` | Aviso de memória evictada pode desaparecer 1 turno antes |

### BAIXA

| # | Bug | Arquivo:Linha | Impacto |
|---|-----|--------------|---------|
| 11 | Sem fases de boss mecânicas — `iniciar_fase_boss` é puramente narrativo, sem mudança de comportamento | Ausente | Boss não muda stats ao mudar de fase |
| 12 | Sem death saves — jogador inconsciente = morto para fins de combate | `combateHelper.js:922` | Sem chance de estabilização durante combate |
| 13 | Resistência/imunidade elemental não informada à LLM | `combateHelper.js:formatarResultadoMecanico` | LLM narra fogo normal quando monstro é imune |
| 14 | Evicção de memória usa sort por importância pura, não por score (que inclui decay) | `mestreContextBuilder.js:75-79` | Memórias antigas de alta importância nunca são evictadas |
| 15 | Snapshot não restaura `personagensCompletos` | `sessaoSnapshot.js:55-67` | Personagens ausentes temporariamente após restauração |
| 16 | `dano_ambiental` não está em `HOLD_UNTIL_TEST_RESOLVED` | `acoesProcessor.js:131-134` | Dano ambiental aplicado antes de teste de esquiva |
| 17 | `level_up` usa canal de emissão diferente (direto `sendToRoom` vs `emitAcaoMestre`) | `acoesProcessor.js:855` | Inconsistência de padrão, mas funcional |

---

## REGRAS DO PROMPT vs MECÂNICA BACKEND — Tabela Completa

| Regra | Prompt | Backend | Veredicto |
|-------|--------|---------|-----------|
| Modificador = floor((atr-10)/2) | sistema.js:242 | combateHelper.js:179,229,343 | **MATCH** |
| Fórmula teste d20+mod+bonus_nível | sistema.js:243 | testeHelper.js:33,147 | **MATCH** |
| XP thresholds Nv2=100..Nv10=4500 | sistema.js:247 | evolucaoHelper.js:68 | **MATCH** |
| Crítico d20=20: dano dobrado, ignora armadura | sistema.js:281 | combateHelper.js:432,449 | **MATCH** |
| Falha d20=1: sempre erra | sistema.js:282 | combateHelper.js:433 | **MATCH** |
| +2 HP máximo por nível | sistema.js:248 | combateHelper.js:176 | **MATCH** |
| +1 ponto atributo por level | sistema.js:248 | evolucaoHelper.js:49 | **MISMATCH** (+2 a cada ímpar) |
| Esquiva = AGI | sistema.js:259,652 | combateHelper.js:338 | **MATCH** |
| Fuga: AGI DC=10+(monstros×2) | sistema.js:373 | combateHelper.js:1027 | **MATCH** |
| Defesa: +25% esquiva, 50% redução | sistema.js:481 | combateHelper.js:872 | **MATCH** |
| Saving throw DC=8+custo_mana | sistema.js:457 | testeHelper.js:157 | **MATCH** |
| Inconsciente HP≤0, todos KO=derrota | sistema.js:360 | combateHelper.js:808,601 | **MATCH** |
| Cura respeita HP máximo | sistema.js:387 | acoesProcessor.js:372 | **MATCH** |
| Dano ambiental ignora armadura | sistema.js:467 | acoesProcessor.js:1026 | **MATCH** |
| Resistência/vulnerabilidade/imunidade | sistema.js:487-489 | combateHelper.js:416 | **MATCH** |
| Fuga sucesso = sem contra-ataques | sistema.js:374 | combateHelper.js:1492 | **MATCH** |
| Crítico ignora esquiva | implícito | combateHelper.js:912 | **MATCH** |
| Mana recalculada no level up | sistema.js:248 | combatEngine.js:96 | **MATCH PARCIAL** (no próximo uso) |

---

## AÇÕES — Cobertura Completa

| Tipo | Handler? | Evento WS | Direcionalidade | holdForTest? |
|------|:--------:|-----------|:----------------:|:------------:|
| dar_item | SIM | item_recebido | OK | - |
| remover_item | SIM | item_removido | OK | - |
| curar | SIM | curado | **BUG** (auto-cura) | SIM |
| aplicar_dano | SIM | dano_recebido | OK (auto-corrige) | SIM |
| aplicar_status | SIM | status_aplicado | OK | - |
| remover_status | SIM | status_removido | OK | - |
| usar_habilidade | SIM | habilidade_usada | OK (auto-corrige) | - |
| conjurar_magia | SIM | magia_conjurada | OK (auto-corrige) | - |
| ativar_desvantagem | SIM | desvantagem_ativada | Sem correção | - |
| aplicar_vantagem | SIM | vantagem_aplicada | Sem correção | - |
| aplicar_efeito | SIM | efeito_aplicado | OK | SIM |
| remover_efeito | SIM | efeito_removido | OK | - |
| dar_xp | SIM | xp_recebido + level_up | OK | SIM |
| concentracao_quebrada | SIM | concentracao_quebrada | OK | - |
| dano_ambiental | SIM | dano_ambiental | OK | **GAP** |
| alterar_terreno | SIM | terreno_alterado | N/A | - |
| mudar_cenario | SIM | cenario_mudado | N/A | - |
| estabilizar_personagem | SIM | personagem_estabilizado | OK | SIM |
| danificar_equipamento | SIM | equipamento_danificado | OK | - |
| iniciar_fase_boss | SIM | boss_fase_alterada | N/A | - |
| missao_batalha | SIM | missao_batalha_registrada | N/A | - |

**21/21 tipos cobertos. 0 ações mortas.**

---

## TOP 5 CORREÇÕES PRIORITÁRIAS

1. **Decremento duplo de status** — Adicionar guard em `_controlarRodada` para não decrementar se `effectManager` já fez. Ou mover todo decremento para UM lugar só.

2. **Concentração não quebra ao receber dano** — Chamar `checkDanoConcentracao(sessao, userId, dano)` em `_executarContraAtaques` quando `alvoStats.hp_atual > 0`.

3. **`curar` em TARGET_ACTIONS** — Adicionar exceção: se ação é `curar` e `personagem` é o jogador atual, NÃO corrigir (auto-cura é legítima).

4. **`gancho` no turnEngine** — Adicionar `gancho: msgInicial?.gancho || resposta?.gancho || null` nos `sendToRoom` do turnEngine.

5. **Prompt: pontos de atributo** — Alinhar texto com backend: "+2 pontos de atributo nos níveis 3, 5, 7 e 9" em vez de "+1 por level up".
