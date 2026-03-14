# Review 3 - Auditoria do plano "Integrar Novidades no Sistema do Mestre IA"

## Objetivo

Esta review audita a nova carta de melhorias do Mestre IA contra o runtime atual do Lunaria.

O objetivo nao e reescrever o plano em abstrato. O objetivo e responder:

1. o que desse plano ja existe;
2. o que esta parcial;
3. o que conflita com a arquitetura atual;
4. o que deve entrar no backlog-3 como evolucao legitima;
5. em que ordem isso deve ser executado sem quebrar o contrato atual do Mestre.

## Fonte de verdade usada na auditoria

Arquivos inspecionados:

- `Backend/agents/Mestre/prompts/sistema.js`
- `Backend/agents/Mestre/MestreAgent.js`
- `Backend/agents/Mestre/contexto/mestreContextBuilder.js`
- `Backend/agents/Mestre/prompts/roteiroCondenser.js`
- `Backend/agents/Resumo/ResumoAgent.js`
- `Backend/helpers/turnStateBuilder.js`
- `Backend/helpers/acoesProcessor.js`
- `Backend/helpers/concentrationManager.js`
- `Backend/helpers/cooldownManager.js`
- `Backend/helpers/effectManager.js`
- `Backend/websocket/engines/masterNarrationEngine.js`
- `Backend/websocket/engines/sessionEngine.js`
- `Backend/services/blueprintService.js`
- `Backend/services/sessaoSnapshot.js`
- `Backend/services/narrationSegmentsService.js`
- `Backend/routes/tts.js`

## Veredito executivo

O plano e util como visao de produto, mas ele nao deve ser executado como "refatorar completamente o MestreAgent".

O runtime atual ja possui:

- prompt com 4 pilares em producao;
- state block de turno, embora ainda enxuto;
- processador de acoes mecanicas para os 4 pilares;
- gerenciadores de concentracao, cooldown e efeitos;
- resumo estruturado;
- roteiro condensado com progressao parcial;
- pipeline de segmentos narrativos e TTS desacoplado.

Portanto, a direcao correta para o backlog-3 nao e "reescrever tudo". A direcao correta e:

- preservar contratos publicos;
- expandir o que ja existe;
- evitar duplicar fontes de verdade;
- decompor a carta em frentes menores e compatveis com o runtime atual.

## Status por tarefa da carta

| Tarefa | Carta diz | Runtime atual diz | Status real |
|---|---|---|---|
| 1. Prompt com 4 pilares | reescrever | 4 pilares ja estao no prompt | Parcialmente implementada |
| 2. Expandir state block | criar/refatorar builder | `turnStateBuilder.js` ja existe, mas e limitado | Parcial |
| 3. Integrar Story Blueprint | injetar blueprint no prompt | roteiro condensado + progressao ja existem | Parcialmente implementada |
| 4. Atualizar schema JSON | reescrever schema | schema atual ja suporta segmentos, acoes e metadados | Parcial e sensivel a contrato |
| 5. Backend actionProcessor | criar/refatorar | `acoesProcessor.js` ja existe com varios handlers | Parcialmente implementada |
| 6. Concentracao | criar manager | `concentrationManager.js` ja existe | Implementada, precisa extensao se necessario |
| 7. Cooldowns | criar manager | `cooldownManager.js` ja existe | Implementada, precisa extensao se necessario |
| 8. Efeitos temporarios | criar manager | `effectManager.js` ja existe | Implementada, precisa extensao se necessario |
| 9. Resumo estruturado | substituir resumo narrativo | `ResumoAgent.js` ja gera resumo estruturado | Implementada, precisa extensao se necessario |
| 10. Compatibilidade/fallbacks | adicionar | fallbacks ja existem no fluxo atual | Parcialmente implementada |

## Achados criticos

### R3-01 - "Refatorar completamente o MestreAgent" conflita com o backlog-3 ja acordado

O backlog-3 atual assume explicitamente:

- nao reescrever o Mestre do zero;
- nao quebrar o pipeline atual;
- nao recolocar TTS no hot path;
- nao trocar o schema por outro incompatvel.

O plano novo abre com "refatorar completamente o MestreAgent". Isso conflita com os principios ja versionados em `Backend/docs/backlog-3/README.md`.

Veredito:

- rejeitar a ideia de reescrita total;
- aceitar apenas evolucao incremental.

### R3-02 - O schema proposto quebra o contrato atual se for aplicado literalmente

Hoje o runtime espera:

- `segmentos` como base da resposta narrativa;
- `solicitaDados` com shape atual;
- `metadados` ja usados por `applyMetadadosToSessao()`;
- `respostaDispatcher` e `testePipeline` acoplados ao schema atual.

O schema novo da carta:

- muda sem necessidade o shape de `solicitaDados`;
- trata `combate` com um shape alternativo ao usado hoje;
- introduz metadados e tipos novos sem garantir compatibilidade com o dispatcher atual.

Veredito:

- nao substituir o schema atual;
- somente estender campos opcionais;
- qualquer novo campo precisa ser backward-compatible.

### R3-03 - O plano tenta criar novas fontes de verdade para estado que hoje vivem na sessao

Hoje:

- cooldowns vivem em `sessao.estadoJogo.cooldowns`;
- concentracao vive em `sessao.estadoJogo.concentracao`;
- efeitos vivem em `personagem.status_efeitos` e no clone runtime;
- itens/XP runtime ja transitam em estado de sessao e clone.

A carta propoe:

- chaves Redis isoladas para cada modulo (`conc:*`, `cd:*`, `efeitos:*`);
- sincronizacao separada por modulo.

Isso cria risco de divergencia entre:

- estado da sessao em Redis;
- snapshot em PostgreSQL;
- estruturas paralelas em Redis.

Veredito:

- nao criar uma segunda arquitetura de estado agora;
- manter a sessao como fonte primaria de runtime;
- so migrar para chaves dedicadas se houver decisao arquitetural formal.

### R3-04 - A proposta de voz/persona entra em conflito com o pipeline atual baseado em segmentos

Hoje o projeto ja tem:

- `segmentos`;
- `npc_id`;
- `voice_id`;
- `voice_provider`;
- metadados narrativos por segmento;
- `narrationSegmentsService.js`.

A carta propoe `persona_falando` como centro do modelo de voz.

Veredito:

- `persona_falando` pode existir no maximo como metadado complementar;
- a autoridade de voz deve continuar sendo `segmentos`.

### R3-05 - Consultar Prisma para montar o state block completo a cada turno e desperdicio

A carta propoe que o `turnStateBuilder`:

- busque personagem completo no banco a cada turno;
- busque inventario atualizado no banco;
- recompose muitas relacoes sempre.

Hoje o runtime ja carrega:

- `sessao.personagensCompletos`;
- `estadoJogo.personagemSessao`;
- cooldowns/concentracao/efeitos na propria sessao;
- clone runtime persistido em paralelo.

Veredito:

- o state block deve enriquecer a sessao atual;
- nao fazer query completa no banco por turno sem necessidade real.

## Achados altos

### R3-06 - Tarefa 1 ja esta parcialmente pronta; reescrita ampla e redundante

`Backend/agents/Mestre/prompts/sistema.js` ja contem:

- bloco de vantagens;
- bloco de desvantagens;
- bloco de habilidades;
- bloco de magias;
- regras dos 4 pilares;
- exemplos de `acoes` para habilidades, magias, efeitos e concentracao;
- schema JSON com `segmentos`, `acoes`, `metadados`.

O que ainda faz sentido:

- lapidar instrucoes;
- adicionar regras de cenario/terreno onde realmente faltarem;
- expandir metadados com muito cuidado;
- revisar exemplos mecanicos inconsistentes.

O que nao faz sentido:

- "reescrever o prompt do zero".

### R3-07 - Tarefa 2 e valida, mas o nome correto e expandir `turnStateBuilder.js`

Hoje `Backend/helpers/turnStateBuilder.js` ja entrega:

- HP e mana;
- cooldowns;
- concentracao;
- vantagens passivas;
- alertas simples de desvantagens;
- efeitos;
- itens ganhos e perdidos;
- texto formatado para injecao no input do Mestre.

Gaps reais:

- cenario/modo narrativo;
- terreno detalhado;
- inventario recente mais rico;
- ultimo teste;
- tensao;
- alertas de desvantagem melhores;
- estado de combate mais expressivo.

Veredito:

- esta tarefa entra no backlog-3 como extensao incremental;
- nao como modulo novo greenfield.

### R3-08 - Tarefa 3 ja existe em forma condensada

O Mestre hoje ja recebe roteiro via:

- `condensarRoteiro()` em `Backend/agents/Mestre/prompts/roteiroCondenser.js`;
- `roteiroCondensado` na criacao do Mestre;
- `montarRoteiro()` no prompt;
- progressao atualizada em `sessionEngine.js` via `atualizarProgressao()`.

Gaps reais:

- filtragem mais contextual de NPCs/locais/twists;
- progresso mais rico;
- melhor conexao com contexto da cena.

Veredito:

- nao criar integracao paralela de blueprint;
- evoluir `roteiroCondenser.js` e `atualizarProgressao()`.

### R3-09 - Tarefa 5 tambem parte de base existente

`Backend/helpers/acoesProcessor.js` ja processa:

- `dar_item`
- `remover_item`
- `curar`
- `aplicar_dano`
- `aplicar_status`
- `remover_status`
- `usar_habilidade`
- `conjurar_magia`
- `ativar_desvantagem`
- `aplicar_vantagem`
- `aplicar_efeito`
- `remover_efeito`
- `dar_xp`
- `concentracao_quebrada`

Gaps reais da carta:

- `dano_ambiental`
- `alterar_terreno`
- `iniciar_fase_boss`
- `missao_batalha`
- `danificar_equipamento`
- `estabilizar_personagem`
- `mudar_cenario`

Veredito:

- estender o registry atual;
- nao reescrever dispatcher/processador inteiro.

### R3-10 - Tarefas 6, 7 e 8 ja existem, mas ainda nao no nivel de riqueza narrado pela carta

Ja existem:

- `Backend/helpers/concentrationManager.js`
- `Backend/helpers/cooldownManager.js`
- `Backend/helpers/effectManager.js`

O backlog-3 correto aqui nao e "criar". E:

- expandir o contrato atual;
- reforcar integracao com combate/turno;
- decidir se continuam na sessao ou se algum dia migram para outra camada.

## Achados medios

### R3-11 - Tarefa 9 ja esta implementada como resumo estruturado

`Backend/agents/Resumo/ResumoAgent.js` ja gera resumo com secoes:

- FATOS
- ITENS
- NPCS
- COMBATE
- DECISOES
- PISTAS
- DESVANTAGENS_ATIVADAS

O que falta da carta:

- cenario atual;
- terreno atual;
- recursos consumidos;
- moral do grupo.

Veredito:

- essa tarefa deve ser reclassificada para "expandir resumo estruturado";
- nao "substituir resumo narrativo", porque isso ja aconteceu.

### R3-12 - O plano mistura frentes mecanicas com frentes narrativas diferentes demais

A carta mistura em um so bloco:

- qualidade de prompt;
- estado de turno;
- processador mecanico;
- IA narrativa;
- blueprint;
- resumo;
- voz/TTS;
- sistemas de combate/boss/batalha grande.

Isso e grande demais para uma unica execucao segura.

Veredito:

- quebrar em epics menores;
- cada uma com contrato claro;
- cada uma com revisao propria.

### R3-13 - O plano trata inventario runtime como se estivesse faltando por completo

Hoje o runtime ja registra:

- itens ganhos/perdidos no clone de sessao;
- XP ganho;
- efeitos ativos;
- runtime de HP/MP;
- itens em `personagem.equipamentos`.

O gap real nao e "nada existe". O gap real e:

- state block do Mestre ainda nao expor isso do jeito mais rico;
- possivel necessidade de lista de inventario recente mais amigavel ao prompt.

## O que deste plano ja nao e mais necessario como esta escrito

Itens que precisam ser reescritos antes de entrar no backlog-3:

1. "Refatorar completamente o MestreAgent"
2. "Criar actionProcessor" do zero
3. "Criar concentrationManager/cooldownManager/effectManager" do zero
4. "Substituir resumo narrativo por estruturado"
5. "Integrar blueprint no prompt" como se nao existisse nada hoje
6. "Trocar o schema atual por outro schema incompatvel"

## O que deve virar backlog-3 de verdade

### B3-F01 - Memoria semantica persistente do Mestre

Ja validada como primeira prioridade.

### B3-F02 - Expansao incremental do state block do turno

Escopo recomendado:

- enriquecer `turnStateBuilder.js`;
- manter injeção pela `masterNarrationEngine`;
- nao consultar Prisma a cada turno sem necessidade;
- incluir somente campos que tenham fonte de verdade clara.

### B3-F03 - Extensao compativel do schema JSON do Mestre

Escopo recomendado:

- manter `segmentos`;
- manter `solicitaDados` compativel;
- adicionar apenas campos opcionais novos;
- revisar exemplos de `acoes` para novos tipos.

### B3-F04 - Extensao do `acoesProcessor.js`

Escopo recomendado:

- adicionar novos action types um a um;
- preservar registry atual;
- amarrar cada tipo novo a uma fonte de verdade ja existente.

### B3-F05 - Blueprint contextual v2

Escopo recomendado:

- evoluir `roteiroCondenser.js`;
- enriquecer `atualizarProgressao()`;
- evitar consulta direta bruta ao blueprint completo dentro do hot path.

### B3-F06 - Resumo estruturado v2

Escopo recomendado:

- acrescentar cenario, terreno, recursos e moral;
- manter o resumo estruturado como formato canonico.

### B3-D01 - Fonte de verdade de estado avancado de combate/cenario

Spike antes de implementar:

- terreno;
- batalha grande;
- fase de boss;
- missoes taticas;
- estado de cenario;
- inventario recente com granularidade narrativa.

Sem esse spike, varias tarefas da carta vao inventar estado sem dono claro.

### B3-F07 - Voz/persona por segmentos

Escopo recomendado:

- evoluir `segmentos`;
- nao mover TTS para o loop sincrono do Mestre;
- tratar `persona_falando` como opcional/complementar se necessario.

## Ordem recomendada apos F-01

1. Fechar `B3-F01` memoria semantica
2. Executar `B3-F02` expansao do state block
3. Executar `B3-F03` extensao compativel do schema
4. Executar `B3-F04` extensao do processador de acoes
5. Executar `B3-F06` resumo estruturado v2
6. Executar `B3-F05` blueprint contextual v2
7. Rodar `B3-D01` spike de estado avancado
8. So depois considerar `B3-F07` voz/persona por segmentos

## Proximos comandos recomendados

### Auditoria rapida de contratos atuais

```powershell
rg -n "montarPersonagens4Pilares|montarSchemaExpandido|criarPromptSistema" Backend/agents/Mestre/prompts/sistema.js
rg -n "buildTurnState|formatTurnStateText" Backend/helpers/turnStateBuilder.js
rg -n "processarUsarHabilidade|processarConjurarMagia|processarAtivarDesvantagem|processarAplicarEfeito|processarConcentracaoQuebrada" Backend/helpers/acoesProcessor.js
rg -n "setConcentracao|decrementConcentracao" Backend/helpers/concentrationManager.js
rg -n "setCooldown|decrementCooldowns" Backend/helpers/cooldownManager.js
rg -n "aplicarEfeito|decrementEfeitos|aplicarEfeitosPorTurno" Backend/helpers/effectManager.js
rg -n "condensarRoteiro|atualizarProgressao" Backend/agents/Mestre/prompts/roteiroCondenser.js
rg -n "_buildStructuredPrompt|FORMATO OBRIGATORIO" Backend/agents/Resumo/ResumoAgent.js
```

### Ordem de leitura minima para qualquer implementacao da carta

```powershell
Get-Content Backend/agents/Mestre/prompts/sistema.js
Get-Content Backend/helpers/turnStateBuilder.js
Get-Content Backend/helpers/acoesProcessor.js
Get-Content Backend/helpers/concentrationManager.js
Get-Content Backend/helpers/cooldownManager.js
Get-Content Backend/helpers/effectManager.js
Get-Content Backend/agents/Mestre/prompts/roteiroCondenser.js
Get-Content Backend/agents/Resumo/ResumoAgent.js
Get-Content Backend/websocket/engines/masterNarrationEngine.js
```

### Validacao minima depois de qualquer lote

```powershell
node --check Backend/agents/Mestre/prompts/sistema.js
node --check Backend/helpers/turnStateBuilder.js
node --check Backend/helpers/acoesProcessor.js
node --check Backend/helpers/concentrationManager.js
node --check Backend/helpers/cooldownManager.js
node --check Backend/helpers/effectManager.js
node --check Backend/agents/Mestre/prompts/roteiroCondenser.js
node --check Backend/agents/Resumo/ResumoAgent.js
node --check Backend/websocket/engines/masterNarrationEngine.js
```

## Status da review

`review-3` considera a carta aprovada como fonte de ideias, mas rejeita sua execucao literal.

Status final:

- `aproveitar como backlog de evolucao`: sim
- `executar como reescrita completa`: nao
- `converter em epics menores do backlog-3`: obrigatorio

