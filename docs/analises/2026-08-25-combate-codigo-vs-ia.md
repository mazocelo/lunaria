# Combate — o que é código e o que ainda é IA (2026-08-25)

> Fonte: resposta do Claude na sessão 29b34b9b do root no VPS (2026-08-25 18:16 UTC), respondendo ao pedido do Marcelo: "existem partes dos motores de combate que pode ser calculado via código e não pela i.a - análisa como tá isso.". O arquivo `tool-results/brrpgnz0s.txt` da mesma sessão era apenas o fonte de `websocket/engines/combatEngine.js` lido durante a análise, não a análise em si.
> Referências arquivo:linha são do backend em `/opt/role-chat-game/backend` naquela data. Nenhuma das 4 prioridades tem registro de aplicação na memória do VPS.

---

Analisei os motores de combate em `/opt/role-chat-game/backend`. Resumo: **a mecânica já está quase toda em código** — a IA narra sobre fato consumado. O que sobrou de cálculo na IA está concentrado em 3 pontos, e são justamente os que mais afetam balanceamento.

## Como está hoje

O pipeline correto já existe: `masterNarrationEngine.js:402` chama `resolverMecanicaCombate()` **antes** de a IA narrar, e injeta o resultado como `[RESULTADO MECÂNICO DA RODADA]` no prompt (`agents/Mestre/prompts/sistema.js:309-313`: *"O sistema resolve TODA a mecânica ANTES de você narrar"*).

Já é 100% código:

| Área | Onde |
|---|---|
| Todas as rolagens (server-side, cliente não envia valor) | `socketManager.js:428`, `testEngine.js:632` |
| Iniciativa, ordem, desempate jogador>monstro | `combatEngine.js:141-151, 282-292` |
| Acerto / crítico / falha crítica | `combateHelper.js:503` |
| Dano, absorção, resistência elemental, DC de magia | `combateHelper.js:1728-1760` |
| Turno do monstro inteiro (alvo, habilidade, dano, teste de morte) | `combatEngine.js:453-606` |
| Fim de combate, XP/PE, level-up multi-nível, loot | `combatEngine.js:613+` |
| Mana e cooldown | `processarHabilidade` + `cooldownManager` |
| DC de fuga = 10 + (monstros vivos × 2) | `combateHelper.js:1344` |
| Interpretação da intenção do jogador (regex, sem LLM) | `combatIntentResolver.js` |

O padrão certo já está documentado em `config/testesConfig.js:5`: *"A IA escolhe QUANDO testar e QUAL dificuldade (criativo); o motor aplica modificadores e resolve (previsível)"*. Ela manda `"Difícil"`, o código traduz para DC 15.

## O que ainda é número escolhido pela IA (candidatos reais a virar código)

**1. Composição e balanceamento do encontro** — o maior. A IA devolve `monstros: [{nome, quantidade, nivel_sugerido}]` + `dificuldade` (`sistema.js:291-303`). O código só faz `Math.min(quantidade, 5)` por tipo (`combateHelper.js:609`) — não há orçamento de encontro, teto total de monstros, nem validação de `nivel_sugerido` contra o nível do grupo. E **`dificuldade` é campo morto**: é lido em `combatEngine.js:67`, salvo no estado e emitido (`:159`, `:196`), e nunca entra em nenhum cálculo. Ou seja, "letal" e "fácil" produzem exatamente o mesmo encontro. O caminho natural é o mesmo do `testesConfig`: tabela `nivelMédio × dificuldade → budget`, e o código deriva quantidade/nível; a IA só sugere quais criaturas fazem sentido na cena.

**2. `aplicar_dano` / `dano_ambiental` / `curar` / `aplicar_efeito`** — `acoesProcessor.js:411`, `:1116`, `:1195`. A IA escreve o inteiro (`"dano": 8`) e o código aplica direto; os únicos limites são resistências, armadura e clamp em 0/hp_max. Não há nenhum teto relativo a HP ou nível — um `dano: 60` alucinado mata um nível 1 na hora, fora do motor de combate e sem rolagem. Mesmo problema em `aplicar_efeito`, onde `duracao` e `dano_por_turno` vêm livres do prompt (`sistema.js:498`). Correção alinhada ao padrão da casa: a IA manda severidade (`leve|moderado|grave`) e elemento, o código converte por nível/HP.

**3. Monstro inventado → stats de fallback** — se o nome não bate no banco, cai em `_gerarStatsGenericos` (`combateHelper.js:754`): `dc_esquiva` fixo em 10, dano `1d6/1d8/1d10`, sem resistências, sem habilidades. Como a IA é livre para inventar nomes, isso não é caso raro — é a válvula de escape padrão dela.

## Coisas que já são código mas estão inconsistentes

- **Alvo do monstro é `Math.random()`** sobre os jogadores vivos (`combatEngine.js:465`) — nem tático em código, nem IA. Trocar por regra determinística (menor HP, quem causou mais dano) é barato e melhora muito a percepção de inteligência do combate.
- **Duas fórmulas divergentes para o ataque Lunaria**: `game-systems/lunaria/combatEngine.js:53` (`resolverAtaque`) existe mas **nunca é chamado no combate de sala** — o turno do monstro Lunaria reimplementa tudo inline em `combatEngine.js:524-578`, com dado por notação + absorção por CON, enquanto o engine usa `1dN + modFOR` sem absorção. 3D&T e D&D passam pelo engine; só Lunaria não.
- **3D&T grava HP no campo errado**: `_resolverAtaqueSistema` escreve em `monstroAlvo.hp` (`combateHelper.js:1094`), mas as instâncias são criadas com `hp_atual`/`hp_max` (`combateHelper.js:641`) e é `hp_atual` que vai para o prompt (`formatarContextoCombate`, `combateHelper.js:811`) e para os eventos de UI. Efeito prático: em 3D&T o HP dos monstros aparece cheio o combate inteiro para o jogador e para a IA, mesmo com o monstro prestes a morrer.
- **D&D 5e não tem combate em sala** (`dnd5e/index.js:71`, `suportaCombateSala: false`) — ali o combate é 100% narrativo pela IA. E se ligarem a flag, `dnd5e/combatEngine.js:26` não retorna `dano`, que é lido em `combatEngine.js:485`.

## Prioridade sugerida

1. `dificuldade` → orçamento de encontro em código (hoje o campo é decorativo).
2. Teto/conversão por severidade em `aplicar_dano` e `dano_ambiental` (é o buraco de balanceamento mais perigoso).
3. Corrigir `hp` vs `hp_atual` no 3D&T.
4. Unificar o ataque Lunaria no engine e trocar o alvo aleatório do monstro por regra.

Se quiser, começo por qualquer um deles — o (1) e o (3) são os de melhor relação impacto/esforço.
