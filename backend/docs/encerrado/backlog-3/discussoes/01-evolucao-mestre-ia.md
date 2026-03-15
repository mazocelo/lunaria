# D-01 — Evolução do Mestre IA

## Contexto

Uma nova carta de melhorias propôs 6 eixos para transformar o Mestre do Lunaria:

1. memória persistente do Mestre;
2. modo narrativo adaptativo;
3. análise de tom do jogador;
4. engine de triggers de desvantagens;
5. tracker de tensão narrativa;
6. mapeamento de vozes por persona.

A ideia é boa, mas a carta original foi escrita como se o sistema atual ainda fosse mais simples do que realmente é. Hoje o projeto já possui:

- `MestreAgent` modular;
- contexto persistente e resumo automático;
- contexto lateral de roleplay;
- segmentos narrativos com metadados;
- NPCs com `voice_id`/`voice_provider`;
- pipeline de TTS desacoplado do hot path do Mestre.

Por isso, este documento adapta a carta ao estado real do código.

## Estado atual relevante

### Núcleo do Mestre

- `Backend/agents/Mestre/MestreAgent.js`
- `Backend/agents/Mestre/prompts/sistema.js`
- `Backend/agents/Mestre/contexto/mestreContextBuilder.js`
- `Backend/agents/Mestre/contexto/mestreInvocationContext.js`
- `Backend/agents/Resumo/ResumoAgent.js`
- `Backend/websocket/engines/masterNarrationEngine.js`

### Voz, segmentos e TTS

- `Backend/services/narrationSegmentsService.js`
- `Backend/websocket/utils/sessionMessages.js`
- `Backend/routes/tts.js`
- `Backend/services/ttsCacheService.js`
- `Backend/services/ttsService.js`
- `Backend/services/blueprintService.js`

### Estado de sessão e roteiro

- `Backend/websocket/engines/sessionEngine.js`
- `Backend/services/sessaoSnapshot.js`
- `Backend/agents/Mestre/prompts/roteiroCondenser.js`

## O que da carta continua válido

### 1. Memória persistente do Mestre

Continua sendo uma melhoria legítima.

Problema real atual:

- o Mestre já recebe `resumo`, `mestreContexto` e contexto persistente;
- porém ainda falta memória semântica estruturada para fatos duradouros como:
  - promessas;
  - segredos revelados;
  - NPCs conhecidos;
  - decisões irreversíveis;
  - pistas principais;
  - histórico importante de desvantagens.

Direção correta:

- criar memória semântica complementar ao resumo, não concorrente;
- usar Redis como camada quente;
- persistir snapshots periódicos em PostgreSQL;
- injetar no contexto do Mestre antes da janela de chat.

### 2. Modo narrativo adaptativo

Também é válido, mas precisa ser introduzido por fases.

Problema real atual:

- o prompt já tem regras fortes para combate, desvantagens, rolagens, segmentos e 4 pilares;
- porém ele ainda não tem um módulo explícito de “cenário narrativo” como exploração, dungeon, survival, social, batalha.

Risco:

- tentar introduzir toda a matriz de modos de uma vez sem o backend já expor flags confiáveis como `em_dungeon`, `cenario_horror`, `batalha_grande`, etc.

Direção correta:

- começar com um detector pequeno de cenário;
- injetar instruções curtas de modo no prompt;
- expandir só depois de validar comportamento.

### 3. Análise de tom do jogador

Boa candidata para implementação.

Direção correta:

- usar heurística leve e barata;
- tratar como modulação de reação do Mestre, não como verdade absoluta;
- injetar no prompt como sinal contextual de curto prazo.

### 4. Trigger engine de desvantagens

É uma das melhores candidatas do backlog-3.

Motivo:

- o sistema já tem desvantagens no contexto do Mestre;
- o prompt já instrui o Mestre a ativá-las;
- o backend já possui ação mecânica `ativar_desvantagem`.

O que falta:

- um motor explícito de alerta de gatilhos para a cena atual.

### 5. Tracker de tensão narrativa

É válido, mas deve entrar primeiro como discussão e spike, não como implementação completa imediata.

Motivo:

- o modelo proposto depende de muitos sinais de estado que hoje não parecem estar todos disponíveis de forma autoritativa e estável;
- há risco alto de inflar complexidade sem ainda ter a telemetria narrativa certa.

Direção correta:

- definir quais sinais o backend consegue fornecer de forma confiável;
- começar com um tracker simples;
- evitar uma matriz grande antes de instrumentar o estado.

### 6. Mapeamento de vozes por persona

Também é válido, mas a forma proposta na carta precisa ser adaptada.

Motivo:

- hoje o runtime já tem `segmentos`, `npc_id`, `voice_id`, `voice_provider`, emoção, ritmo e intensidade;
- a proposta de `persona_falando` isolada é mais fraca do que a infraestrutura atual.

Direção correta:

- evoluir o pipeline de segmentos;
- mapear voz por segmento/persona/NPC;
- manter TTS desacoplado do hot path do Mestre.

## O que da carta precisa ser reescrito

### 1. “buildSystemPrompt”

No projeto atual, o ponto correto não é `buildSystemPrompt`, e sim:

- `criarPromptSistema` em `Backend/agents/Mestre/prompts/sistema.js`

### 2. TTS dentro do fluxo síncrono principal

Isso não deve ser implementado como descrito na carta.

Hoje o sistema correto é:

- o Mestre gera narrativa + segmentos + metadados;
- o TTS é resolvido fora do hot path.

Voltar a gerar áudio síncrono dentro do loop principal seria regressão arquitetural.

### 3. `persona_falando` como schema principal

Isso não deve substituir o sistema atual.

O caminho correto é:

- estender o uso de `segmentos`;
- aproveitar `npc_id`, `voice_id`, `voice_provider`;
- reforçar regras de seleção de voz sobre a infraestrutura existente.

### 4. Suposição de que o Mestre “esquece tudo”

Isso está parcialmente desatualizado.

Hoje já existem:

- `resumos`;
- `mestreContexto`;
- contexto persistente formatado;
- contexto lateral roleplay controlado.

O gap real não é memória zero, e sim ausência de memória semântica estruturada.

## Proposta de organização do backlog-3

### F-01 — Memória semântica persistente do Mestre

Objetivo:

- manter fatos canônicos importantes fora da janela curta de chat;
- suportar promessas, segredos, NPCs, decisões, pistas e efeitos narrativos relevantes.

### F-02 — Engine leve de modo narrativo

Objetivo:

- adaptar o tom da narração ao cenário atual;
- começar pequeno e validável.

### F-03 — Analisador de tom do jogador

Objetivo:

- modular a resposta do mundo ao temperamento do jogador.

### F-04 — Trigger engine de desvantagens

Objetivo:

- reduzir esquecimento de gatilhos de desvantagens;
- priorizar no máximo 1 trigger forte por turno/cena.

### D-02 — Modelo de tensão narrativa

Objetivo:

- definir sinais reais de estado antes de automatizar a escalada/relaxamento da experiência.

### F-05 — Roteamento de voz por segmentos e persona

Objetivo:

- aproveitar melhor as vozes disponíveis sem quebrar o pipeline atual.

## Ordem recomendada

1. F-01 — memória semântica persistente
2. F-04 — trigger engine de desvantagens
3. F-03 — análise de tom do jogador
4. F-02 — modo narrativo adaptativo
5. D-02 — modelo de tensão narrativa
6. F-05 — roteamento de voz por segmentos/persona

## Critérios de aceite do backlog-3

1. Nenhuma melhoria regride o pipeline atual do Mestre.
2. TTS continua fora do hot path principal.
3. Segmentos continuam sendo a autoridade de voz/entrega narrativa.
4. Memória nova complementa resumo e contexto, não os substitui cegamente.
5. Desvantagens ganham confiabilidade sem virar spam.
6. Modos narrativos e tom do jogador alteram o comportamento do Mestre de forma observável.

## Handoff

Se outra instância pegar este backlog:

1. Ler `Backend/agents/Mestre/MestreAgent.js`
2. Ler `Backend/agents/Mestre/prompts/sistema.js`
3. Ler `Backend/agents/Mestre/contexto/mestreContextBuilder.js`
4. Ler `Backend/agents/Mestre/contexto/mestreInvocationContext.js`
5. Ler `Backend/services/narrationSegmentsService.js`
6. Ler `Backend/routes/tts.js`

E só depois propor implementação.
