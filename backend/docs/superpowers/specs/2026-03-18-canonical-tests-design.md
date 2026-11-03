# Spec: Testes Canônicos Repetíveis — Lunaria RPG

**Data:** 2026-03-18
**Status:** Aprovado
**Versão:** 1.0

---

## 1. Objetivo

Criar uma suíte de testes que valida a experiência real do jogador executando partidas completas contra 3 modelos de IA (Groq, Gemini Flash, Claude Sonnet), usando cenários pré-definidos com ações curadas. Os testes validam invariantes mecânicas e contratos de resposta — nunca texto literal da IA.

## 2. Arquitetura

Três camadas independentes:

```
FIXTURES (cenários declarativos)
    ↓
RUNNER (executa partida real, salva log)
    ↓
VALIDADOR (vitest) + RELATÓRIO (comparativo)
```

- **Fixture**: define personagem, estado, inimigos, ações e invariantes
- **Runner**: joga a partida contra IA real, grava tudo em JSON
- **Validador**: lê o JSON, aplica invariantes, reporta pass/fail
- **Relatório**: compara os 3 modelos lado a lado

## 3. Glossário

Termos com significado formal nesta spec:

| Termo | Definição |
|-------|----------|
| **turno** | Uma interação jogador→IA dentro de uma rodada. Inclui: ação do jogador, resposta da IA, rolagens e resolução mecânica. Um turno produz um objeto no array `turnos` do log. |
| **rodada** | Ciclo completo em que todos os jogadores agem uma vez. No cenário canônico com 1 jogador, rodada = sequência de turnos até `fimDeTurno` ou condição de parada. |
| **ação** | Entrada do jogador: uma mensagem, um iniciar_turno, ou uma rolagem de dado. Cada ação está declarada no array `acoes` da fixture. |
| **gameIntent** | Objeto que declara a intenção mecânica de uma ação. Usado em todo o sistema — NÃO usar `combatIntent` ou `intent` como sinônimos. `gameIntent` é o nome canônico. Deve conter ID estável do alvo, nunca nome textual. |
| **derrotado** | Status atribuído a uma entidade (jogador ou inimigo) quando `hp === 0`. O runner DEVE setar `status: ["derrotado"]` ao detectar `hp === 0`. A invariante valida essa convenção. |
| **resolucaoMecanica** | Objeto que registra o cálculo da engine de regras para uma ação. Sempre presente no log como campo (nunca ausente como key). Valor: objeto quando há mecânica, `null` quando a ação é narrativa/social/exploração. |
| **id estável** | Identificador único de entidade (inimigo, magia, habilidade, equipamento). Usado em `gameIntent`, `respostaIA.acoes` e `resolucaoMecanica`. Nunca usar nome textual como referência. |

## 4. Estrutura de Arquivos

```
scripts/
  canonical-runner.js          # executa partidas contra os 3 modelos
  canonical-report.js          # gera relatório comparativo

tests/
  fixtures/
    scenarios/
      01-combate-basico.json
      02-magia-com-custo.json
      03-habilidade-cooldown.json
      04-efeitos-status.json
      05-vantagem-desvantagem.json
      06-acao-invalida.json
      07-vitoria-recompensa.json
      08-derrota-fuga.json
      09-multiplos-inimigos.json
      10-arco-completo.json
    frozen/                    # gerados pelo runner, não editados manualmente
      {cenarioId}/
        groq.json
        gemini.json
        sonnet.json
        report.json
        report.md
  scenarios/
    invariants.js              # funções de validação reutilizáveis
    01-combate-basico.test.js
    02-magia-com-custo.test.js
    ...
```

## 5. Formato da Fixture

```json
{
  "id": "01-combate-basico",
  "titulo": "Combate básico com monstro único",
  "versao": "1.0.0",

  "personagem": {
    "nome": "Moruxis",
    "classe": "Paladino",
    "raca": "Minotauro",
    "nivel": 1,
    "atributos": {
      "forca": 10, "inteligencia": 10, "carisma": 7,
      "destreza": 14, "constituicao": 10, "agilidade": 14
    },
    "magias": [
      {
        "id": "luz_divina",
        "nome": "Luz Divina",
        "escola": "evocacao",
        "custo_mana": 3,
        "dano_base": "1d8",
        "atributo": "carisma"
      }
    ],
    "habilidades": [
      {
        "id": "investida",
        "nome": "Investida",
        "tipo": "ataque",
        "recurso": "cooldown",
        "cooldown_turnos": 2,
        "bonus_dano": 4
      }
    ],
    "vantagens": [
      {
        "id": "mente_labirintica",
        "nome": "Mente Labiríntica",
        "efeito": "bonus_teste",
        "atributo_afetado": "inteligencia",
        "bonus": 2,
        "contexto": "investigacao e puzzles"
      }
    ],
    "desvantagens": [
      {
        "id": "intimidador",
        "nome": "Aparência Intimidadora",
        "efeito": "penalidade_teste",
        "atributo_afetado": "carisma",
        "penalidade": -2,
        "contexto": "interacoes sociais"
      }
    ],
    "equipamentos": [
      {
        "id": "espada_longa",
        "nome": "Espada Longa",
        "dano": "1d8",
        "tipo": "melee",
        "bonus_ataque": 1
      }
    ]
  },

  "estadoInicial": {
    "hp": 30,
    "hpMax": 30,
    "mana": 10,
    "manaMax": 10,
    "status": [],
    "cooldowns": {},
    "concentracao": null,
    "efeitos_ativos": [],
    "emCombate": false,
    "turno": 0,
    "xp": 0
  },

  "inimigos": [
    {
      "id": "goblin_1",
      "nome": "Goblin Saqueador",
      "hp": 12,
      "hpMax": 12,
      "ataque": 4,
      "dano": "1d6",
      "esquiva": 8,
      "armadura": 1,
      "xp": 25,
      "status": []
    }
  ],

  "historia": {
    "nome": "Cenário de Teste - Combate",
    "temas": ["Fantasia"],
    "mestreConfig": {
      "nome": "Mestre Teste",
      "personalidade": "Direto e mecânico, prioriza clareza.",
      "temperatura": 0.6
    }
  },

  "acoes": [
    { "tipo": "iniciar_turno" },
    {
      "tipo": "mensagem",
      "texto": "Ataco o goblin com minha espada",
      "gameIntent": {
        "categoria": "combate",
        "tipo": "atacar",
        "arma": "espada_longa",
        "alvo": "goblin_1"
      }
    },
    { "tipo": "rolar_dado", "quando": "se_solicitado", "estrategia": "auto" },
    {
      "tipo": "mensagem",
      "texto": "Lanço Luz Divina no goblin",
      "gameIntent": {
        "categoria": "combate",
        "tipo": "usar_habilidade",
        "magiaId": "luz_divina",
        "alvo": "goblin_1"
      }
    },
    { "tipo": "rolar_dado", "quando": "se_solicitado", "estrategia": "auto" },
    {
      "tipo": "mensagem",
      "texto": "Uso Investida para finalizar",
      "gameIntent": {
        "categoria": "combate",
        "tipo": "usar_habilidade",
        "habilidadeId": "investida",
        "alvo": "goblin_1"
      }
    }
  ],

  "condicoesDeParada": {
    "qualquerUma": [
      "combate_finalizado",
      "acoes_esgotadas",
      "fim_de_arco",
      "jogador_derrotado"
    ]
  },

  "invariantes": [
    "resposta_ia_parseavel",
    "hp_nunca_negativo",
    "hp_nunca_acima_maximo",
    "mana_nunca_negativa",
    "mana_nunca_acima_maximo",
    "mana_descontada_ao_usar_magia",
    "cooldown_aplicado_apos_habilidade",
    "habilidade_em_cooldown_nao_reutilizada",
    "magia_inexistente_nao_aceita",
    "dano_aplicado_quando_ataque_sucede",
    "monstro_derrotado_quando_hp_zero",
    "equipamento_usado_existe_no_inventario",
    "xp_distribuido_apos_vitoria",
    "combate_encerra_sem_monstros_vivos",
    "alvos_referenciados_por_id"
  ]
}
```

Todas as entidades (inimigos, equipamentos, magias, habilidades) são referenciadas por **id estável**, não por nome textual.

## 6. Formato do Log

```json
{
  "runId": "run_20260318_014523_a3f2",
  "cenarioId": "01-combate-basico",
  "cenarioVersao": "1.0.0",
  "cenarioHash": "sha256:...",
  "modelo": "gemini-2.5-flash",
  "provider": "gemini",
  "redisPrefix": "test_run_a3f2:",
  "statusExecucao": "concluida | falha_parsing | erro_execucao | timeout",
  "erroExecucao": null,
  "iniciadoEm": "ISO8601",
  "finalizadoEm": "ISO8601",
  "duracaoMs": 54400,
  "metricas": {
    "turnosExecutados": 6,
    "respostasParseadas": 6,
    "errosParse": 0,
    "rolagensAutomaticas": 3,
    "latenciaMediaMs": 2340,
    "latenciaMaxMs": 4100,
    "tokensInput": null,
    "tokensOutput": null,
    "custoEstimado": null
  },
  "condicaoDeParada": "combate_finalizado",

  "turnos": [
    {
      "turno": 1,
      "acaoJogador": { "tipo": "mensagem", "texto": "...", "gameIntent": {} },
      "estadoAntes": { "jogador": {}, "inimigos": [], "combateAtivo": false },
      "respostaBruta": "string original da IA",
      "respostaIA": { "narracao": "", "fimDeTurno": false, "solicitaDados": {}, "acoes": [], "metadados": {} },
      "respostaParseou": true,
      "erroParse": null,
      "resolucaoMecanica": null,
      "rolagemAutomatica": null,
      "estadoApos": { "jogador": {}, "inimigos": [], "combateAtivo": true },
      "tempoRespostaMs": 2340,
      "tempoTurnoTotalMs": 2580
    }
  ],

  "estadoFinal": {
    "jogador": { "hp": 22, "hpMax": 30, "mana": 4, "manaMax": 10, "xpGanho": 25, "status": [] },
    "inimigos": [{ "id": "goblin_1", "hp": 0, "hpMax": 12, "status": ["derrotado"] }],
    "combateAtivo": false,
    "resultado": "vitoria",
    "resultadoDetalhe": "ultimo_inimigo_derrotado"
  }
}
```

### Contratos do log

- **`metricas.tokensInput/Output/custoEstimado`**: opcionais (`null` quando provider não devolver)
- **`turno.resolucaoMecanica`**: campo sempre presente no log (nunca ausente como key). Valor: objeto quando a ação envolve mecânica (ataque, magia, teste). `null` para ações narrativas, sociais ou exploração. Quando presente, referencia alvos por id estável.
- **`turno.erroParse`**: `null` quando ok. Quando falha: `{ "tipo": "json_invalido|campo_ausente|tipo_inesperado", "mensagem": "...", "trecho": "..." }`
- **`turnosExecutados`**: conta exatamente os objetos no array `turnos` do log
- **`tempoRespostaMs`**: tempo da chamada à IA. **`tempoTurnoTotalMs`**: tempo total incluindo resolução mecânica e persistência.
- **`erroExecucao`**: `null` quando ok. Objeto `{ "tipo": "...", "mensagem": "...", "stack": "..." }` quando o runner falha.
- **IDs estáveis**: em `gameIntent`, `respostaIA.acoes` e `resolucaoMecanica`, toda referência a alvo, magia, habilidade ou equipamento usa o `id` definido na fixture — nunca nome textual.
- **Contrato de "derrotado"**: quando `hp === 0`, o runner seta `status: ["derrotado"]`. A invariante `monstro_derrotado_quando_hp_zero` valida essa convenção.
- **`estadoFinal.jogador.xpGanho`**: campo obrigatório. Registra o delta de XP ganho durante a partida (0 se derrota/fuga).

## 7. Invariantes

Todas as invariantes seguem a assinatura:

```js
function nomeInvariante(log, cenario) → { ok: boolean, falhas: string[] }
```

- `ok` é sempre derivado de `falhas.length === 0`
- Cada falha indica: turno, valores esperados, valores recebidos
- O validador importa apenas as invariantes listadas na fixture

### Catálogo de invariantes

| Nome | O que valida |
|------|-------------|
| `resposta_ia_parseavel` | Todo turno tem `respostaParseou === true` |
| `hp_nunca_negativo` | `hp >= 0` em todo estadoAntes/Apos (jogador e inimigos) |
| `hp_nunca_acima_maximo` | `hp <= hpMax` sempre |
| `mana_nunca_negativa` | `mana >= 0` sempre |
| `mana_nunca_acima_maximo` | `mana <= manaMax` sempre |
| `mana_descontada_ao_usar_magia` | Quando gameIntent usa magiaId: `manaApos = manaAntes - custo_mana` |
| `cooldown_aplicado_apos_habilidade` | Quando gameIntent usa habilidadeId com cooldown: aparece em `estadoApos.cooldowns` |
| `habilidade_em_cooldown_nao_reutilizada` | Se habilidade em cooldown no estadoAntes, não é usada com sucesso |
| `magia_inexistente_nao_aceita` | IA não resolve magia que não está em `cenario.personagem.magias` |
| `dano_aplicado_quando_ataque_sucede` | Se `resolucaoMecanica.sucesso === true` e tipo é ataque: `hpApos < hpAntes` do alvo. Exceção: mitigação total (armadura >= dano) é válida quando evidenciada na resolução. |
| `monstro_derrotado_quando_hp_zero` | Se `inimigo.hp === 0`: status inclui "derrotado" |
| `combate_encerra_sem_monstros_vivos` | Se todos inimigos com `hp === 0`: `combateAtivo === false` |
| `xp_distribuido_apos_vitoria` | Se `resultado === "vitoria"`: `estadoFinal.jogador.xpGanho > 0`. O campo `xpGanho` é obrigatório no `estadoFinal.jogador` e registra o delta de XP ganho na partida. |
| `equipamento_usado_existe_no_inventario` | Arma/item no gameIntent existe em `cenario.personagem.equipamentos` |
| `vantagem_aplica_bonus_no_contexto_correto` | Se ação no contexto da vantagem: `resolucaoMecanica.modificador` inclui bonus |
| `desvantagem_aplica_penalidade_no_contexto_correto` | Similar, com penalidade |
| `alvos_referenciados_por_id` | Toda referência a alvo usa id do cenário, não nome textual |
| `ia_nao_inventou_habilidade` | Ações mecânicas da respostaIA referem apenas habilidades/magias do personagem |

## 8. Os 10 Cenários

| ID | Título | Foco | Invariantes principais | Condição de parada |
|----|--------|------|----------------------|-------------------|
| `01-combate-basico` | Combate corpo a corpo | Ataque → dado → dano → vitória | `dano_aplicado_quando_ataque_sucede`, `monstro_derrotado_quando_hp_zero`, `xp_distribuido_apos_vitoria` | `combate_finalizado` |
| `02-magia-com-custo` | Magia: sucesso e falha por mana | Magia gasta mana → sem mana bloqueia | `mana_descontada_ao_usar_magia`, `magia_inexistente_nao_aceita` | `combate_finalizado` ou `acoes_esgotadas` |
| `03-habilidade-cooldown` | Habilidade com cooldown por turno | Usa → cooldown ativa → reuso bloqueado | `cooldown_aplicado_apos_habilidade`, `habilidade_em_cooldown_nao_reutilizada`. Cooldown contado em **turnos**. | `acoes_esgotadas` |
| `04-efeitos-status` | Buff/debuff com duração | Buff ativo → bônus → expira → removido | Efeito registrado no `estadoAntes`, removido no `estadoApos` correto | `acoes_esgotadas` |
| `05-vantagem-desvantagem` | Modificadores contextuais | Investigação (+2) → social (-2) | `vantagem_aplica_bonus_no_contexto_correto`, `desvantagem_aplica_penalidade_no_contexto_correto` | `acoes_esgotadas` |
| `06-acao-invalida` | 3 sub-cenários: magia/arma inexistente, agir incapacitado | Rejeição de ações impossíveis | `magia_inexistente_nao_aceita`, `equipamento_usado_existe_no_inventario`, `ia_nao_inventou_habilidade` | `acoes_esgotadas` |
| `07-vitoria-recompensa` | Matar inimigos → XP → loot → level up | Desfecho positivo completo | `xp_distribuido_apos_vitoria`, `combate_encerra_sem_monstros_vivos`. Loot e level up são **condicionais**. | `combate_finalizado` |
| `08-derrota-fuga` | 2 sub-cenários: HP zero e fuga | Desfechos negativos distintos | `resultado` === `"derrota"` ou `"fuga"`, HP coerente, sem XP de vitória. `resultadoDetalhe` distintos. | `jogador_derrotado` ou `combate_finalizado` |
| `09-multiplos-inimigos` | 3 monstros com HP independente | Gestão de múltiplos alvos | `alvos_referenciados_por_id`, cada inimigo HP independente | `combate_finalizado` |
| `10-arco-completo` | Início → exploração → combate → pós-combate | Composição de fluxos | Todas anteriores + continuidade. **Integração pesada**, não bloqueador. | `fim_de_arco` |

### Ordem de implementação

```
Fase 1 (core):      01, 02, 06 + runner + invariants base + report
Fase 2 (recursos):  03, 04, 05 + invariants de cooldown/efeito/vantagem
Fase 3 (desfechos): 07, 08, 09, 10 + invariants de XP/loot/fuga
```

## 9. Runner

### Responsabilidade

O runner **executa e registra**. Não valida, não decide pass/fail.

### Como funciona

1. Lê a fixture do cenário
2. Cria sessão no Redis com prefix isolado (`test_run_{runId}:`)
3. Instancia MestreAgent com o modelo do turno
4. Executa cada ação em sequência, usando as funções reais do jogo (`resolverMecanicaCombate`, `resolverTeste`, `calcularHP`, etc.)
5. Após cada resposta da IA: captura estadoAntes/Apos, respostaBruta, resolucaoMecanica
6. Checa condicoesDeParada
7. Salva log completo em `tests/fixtures/frozen/{cenarioId}/{modelo}.json`
8. Limpa chaves Redis do run

### Isolamento

- Redis: prefix único por run, limpeza ao final
- Não usa websocket — chama MestreAgent diretamente
- Não depende de estado de sessões reais

### CLI

```bash
node scripts/canonical-runner.js 01-combate-basico              # 3 modelos
node scripts/canonical-runner.js 01-combate-basico --model groq  # 1 modelo
node scripts/canonical-runner.js --all                           # todos cenários
```

## 10. Relatório

### Conteúdo

- **Cabeçalho**: cenarioId, versao, cenarioHash, data
- **Tabela de métricas**: latência, tokens, custo (opcionais), turnos, erros parse — por modelo
- **Tabela de invariantes**: cada invariante × cada modelo (pass/fail)
- **Falhas detalhadas**: turno, valores esperados, valores recebidos
- **Veredito por modelo**: resumo de N/total invariantes passaram
- **Resumo final**: `Groq 14/14 ✅ | Gemini 12/14 ⚠️ | Sonnet 14/14 ✅`

### Formatos

- Terminal (colorido)
- `report.json` (estruturado)
- `report.md` (compartilhável)

### CLI

```bash
node scripts/canonical-report.js 01-combate-basico
node scripts/canonical-report.js --all
```

## 11. Riscos e Limitações

| Risco | Mitigação |
|-------|----------|
| IA demora demais (timeout) | Runner tem timeout por turno (60s Groq, 120s Sonnet), statusExecucao registra |
| IA retorna JSON inválido | respostaBruta salva, erroParse estruturado, invariante detecta |
| Combate nunca termina (loop) | condicaoDeParada inclui acoes_esgotadas como safety net |
| Redis poluído | prefix isolado + cleanup automático |
| Custo alto com Sonnet | métricas opcionais, pode rodar só Groq/Gemini no dia-a-dia |
| Loot/level up não garantidos | invariantes condicionais: validam se presentes, não exigem |
