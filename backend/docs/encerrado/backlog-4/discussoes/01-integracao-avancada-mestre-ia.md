# D-01 - Integracao avancada do Mestre IA

## Contexto

Uma nova carta de melhorias propoe:

1. reforcar prompt e regras dos 4 pilares;
2. expandir o state block do turno;
3. integrar melhor o Story Blueprint;
4. ampliar o schema JSON do Mestre;
5. expandir o processador de acoes mecanicas;
6. aprofundar concentracao, cooldowns e efeitos;
7. evoluir o resumo estruturado;
8. reforcar compatibilidade e fallbacks.

A carta e util como visao de produto, mas a `review-3` mostrou que ela nao pode ser executada literalmente como reescrita completa do Mestre.

Este documento adapta a carta ao estado real do codigo.

## Estado atual relevante

### Prompt e resposta do Mestre

- `Backend/agents/Mestre/prompts/sistema.js`
- `Backend/agents/Mestre/MestreAgent.js`
- `Backend/websocket/utils/respostaDispatcher.js`
- `Backend/websocket/utils/testePipeline.js`

Hoje o projeto ja possui:

- secoes de vantagens, desvantagens, habilidades e magias no prompt;
- regras dos 4 pilares;
- schema com `segmentos`, `acoes`, `metadados` e `solicitaDados`;
- parser de fallback quando a IA retorna JSON ruim.

### State block e turno

- `Backend/helpers/turnStateBuilder.js`
- `Backend/websocket/engines/masterNarrationEngine.js`

Hoje ja existe:

- bloco de estado com HP, mana, cooldowns, concentracao, efeitos, itens ganhos/perdidos, vantagens passivas e alertas simples de desvantagens;
- injecao desse bloco antes da acao do jogador no fluxo do Mestre.

### Runtime mecanico

- `Backend/helpers/acoesProcessor.js`
- `Backend/helpers/concentrationManager.js`
- `Backend/helpers/cooldownManager.js`
- `Backend/helpers/effectManager.js`

Hoje ja existe:

- processador de acoes mecanicas para os 4 pilares;
- cooldowns;
- concentracao;
- efeitos temporarios;
- persistencia parcial em clone runtime da sessao.

### Blueprint e resumo

- `Backend/agents/Mestre/prompts/roteiroCondenser.js`
- `Backend/services/blueprintService.js`
- `Backend/agents/Resumo/ResumoAgent.js`
- `Backend/websocket/engines/sessionEngine.js`

Hoje ja existe:

- roteiro condensado no prompt do Mestre;
- progressao parcial do blueprint por resumo;
- resumo estruturado com secoes canonicas.

## O que da carta continua valido

### 1. State block v2

Continua sendo uma frente forte.

Gap real:

- falta enriquecer cenario, modo narrativo, terreno, ultimo teste, tensao e inventario recente mais legivel para o Mestre.

Direcao correta:

- expandir `turnStateBuilder.js`;
- reaproveitar `sessao.personagensCompletos` e `estadoJogo`;
- evitar query completa ao banco em todo turno.

### 2. Prompt 4 pilares v2

Continua valido como refinamento, nao como reescrita.

Gap real:

- ainda faltam instrucoes melhores para terreno, cenario, emboscada, boss, batalha grande e survival;
- ainda cabe lapidar a clareza do contrato mecanico.

Direcao correta:

- evoluir `sistema.js`;
- preservar as secoes e o schema atual;
- adicionar somente o que for backward-compatible.

### 3. Schema JSON v2

Continua valido, com restricao forte.

Gap real:

- faltam alguns campos opcionais para cenario, terreno, ameacas e certos tipos de acoes.

Direcao correta:

- estender o schema atual;
- nao trocar o shape principal de `solicitaDados`, `combate` e `segmentos`.

### 4. Acoes mecanicas de cenario

Continua sendo uma frente legitima.

Gap real:

- faltam action types para dano ambiental, alteracao de terreno, fase de boss, missao de batalha, dano em equipamento, estabilizacao e mudanca de cenario.

Direcao correta:

- estender o registry de `acoesProcessor.js`;
- manter o dispatcher atual.

### 5. Runtime tatico mais rico

Continua valido, mas precisa de fonte de verdade clara.

Gap real:

- terreno, boss phase, batalha grande, missoes taticas e transicao de cenario ainda nao tem contrato de estado tao claro quanto HP, mana e cooldown.

Direcao correta:

- fazer um spike primeiro;
- definir dono de cada dado no `estadoJogo` antes de acoplar mais regras ao prompt.

### 6. Blueprint contextual v2

Continua valido.

Gap real:

- o roteiro condensado ainda pode ficar mais contextual ao ato atual, local atual e NPCs relevantes da cena.

Direcao correta:

- evoluir `roteiroCondenser.js`;
- aproveitar a progressao ja existente;
- evitar consulta direta bruta ao blueprint completo no hot path.

### 7. Resumo estruturado v2

Continua valido.

Gap real:

- falta trazer cenario atual, terreno atual, recursos consumidos e moral do grupo.

Direcao correta:

- expandir `ResumoAgent.js`;
- manter o formato estruturado ja em producao.

## O que da carta precisa ser reescrito

### 1. "Refatorar completamente o MestreAgent"

Nao entra no backlog-4.

Motivo:

- conflita com `review-3`;
- conflita com `backlog-3`;
- joga fora evolucoes que ja estao em producao.

### 2. "Criar actionProcessor" do zero

Nao entra como formulacao correta.

O correto e:

- ampliar `Backend/helpers/acoesProcessor.js`.

### 3. "Criar concentrationManager/cooldownManager/effectManager"

Tambem nao entra assim.

O correto e:

- revisar e expandir os managers existentes.

### 4. "Substituir resumo narrativo"

Ja aconteceu.

O correto e:

- resumir como "Resumo estruturado v2".

### 5. "Integrar blueprint" como se ainda nao existisse

Ja existe integracao parcial.

O correto e:

- blueprint contextual v2.

### 6. "Criar chaves Redis separadas para tudo"

Nao entra sem decisao arquitetural.

O correto e:

- manter a sessao como fonte primaria de runtime;
- so abrir uma nova arquitetura de estado se isso for uma decisao formal.

## Proposta de organizacao do backlog-4

### B4-F01 - State block do turno v2

Objetivo:

- expandir `turnStateBuilder.js` com:
  - cenario;
  - modo narrativo;
  - terreno;
  - ultimo teste;
  - tensao;
  - inventario recente mais rico;
  - alertas melhores de desvantagem.

### B4-F02 - Prompt e regras mecanicas v2

Objetivo:

- lapidar as instrucoes dos 4 pilares;
- adicionar regras de cenario e terreno onde faltarem;
- manter compatibilidade com o schema atual.

### B4-F03 - Schema JSON compativel v2

Objetivo:

- adicionar metadados e action types opcionais;
- manter `segmentos` como base narrativa;
- preservar o contrato atual de `solicitaDados`.

### B4-F04 - Acoes mecanicas de cenario

Objetivo:

- ampliar `acoesProcessor.js` com:
  - `dano_ambiental`
  - `alterar_terreno`
  - `iniciar_fase_boss`
  - `missao_batalha`
  - `danificar_equipamento`
  - `estabilizar_personagem`
  - `mudar_cenario`

### B4-F05 - Runtime unificado de estado tatico

Objetivo:

- melhorar tracking de:
  - itens temporarios;
  - XP de sessao;
  - efeitos ativos;
  - estado de boss;
  - terreno tatico;
  - missoes de batalha.

Restricao:

- sem criar fonte de verdade paralela sem decisao formal.

### B4-F06 - Blueprint contextual v2

Objetivo:

- tornar o roteiro condensado mais sensivel a:
  - ato atual;
  - NPCs relevantes;
  - local atual;
  - twists pendentes;
  - progressao recente.

### B4-F07 - Resumo estruturado v2

Objetivo:

- adicionar:
  - cenario atual;
  - terreno atual;
  - recursos consumidos;
  - moral do grupo.

### B4-D01 - Spike de fonte de verdade para cenario e combate avancado

Objetivo:

- definir contrato de estado para:
  - terreno;
  - emboscada;
  - boss phase;
  - batalha grande;
  - missao tatica;
  - mudanca de cenario.

Sem esse spike, o resto tende a acoplar dados inventados ao prompt.

### B4-D02 - Compatibilidade, fallbacks e E2E

Objetivo:

- garantir que historias sem blueprint continuam funcionando;
- garantir que personagens sem desvantagens nao recebem inventacao;
- garantir parser resiliente;
- validar que modulos auxiliares falhando nao travam a sessao.

## Ordem recomendada

1. `B4-F01` State block do turno v2
2. `B4-F02` Prompt e regras mecanicas v2
3. `B4-F03` Schema JSON compativel v2
4. `B4-F04` Acoes mecanicas de cenario
5. `B4-D01` Spike de estado tatico/cenario
6. `B4-F05` Runtime unificado de estado tatico
7. `B4-F07` Resumo estruturado v2
8. `B4-F06` Blueprint contextual v2
9. `B4-D02` Compatibilidade e validacao E2E

## Handoff

Antes de qualquer implementacao desta frente, ler nesta ordem:

1. `Backend/docs/review-3/README.md`
2. `Backend/agents/Mestre/prompts/sistema.js`
3. `Backend/helpers/turnStateBuilder.js`
4. `Backend/helpers/acoesProcessor.js`
5. `Backend/helpers/concentrationManager.js`
6. `Backend/helpers/cooldownManager.js`
7. `Backend/helpers/effectManager.js`
8. `Backend/agents/Mestre/prompts/roteiroCondenser.js`
9. `Backend/agents/Resumo/ResumoAgent.js`
10. `Backend/websocket/engines/masterNarrationEngine.js`

Depois disso:

- propor lotes pequenos;
- preservar compatibilidade;
- evitar reescrita total;
- validar cada lote com `node --check` e leitura de contrato.

