# Backlog 5 - Evolucao do Wizard de Personagem

Este backlog organiza a proxima camada de evolucao do wizard de criacao de personagem do Lunaria.

O foco aqui nao e trocar o wizard atual por outro produto nem reescrever tudo em um "big bang". O foco e:

- reduzir friccao de criacao;
- separar melhor fluxo de wizard e conversa com o Mestre Criador;
- tornar a progressao entre etapas explicita, reversivel e valida;
- melhorar retomada de rascunho e revisao final;
- corrigir inconsistencias de build antes de ampliar escopo visual;
- manter a evolucao do wizard como frente `frontend-first`, sem criar dependencia desnecessaria de backend.

## Status

`backlog-5` esta em planejamento ativo.

## Fonte de verdade desta frente

Arquivos atuais inspecionados:

- `Frontend/src/Pages/Personagem/Wizard/wizard.model.js`
- `Frontend/src/Pages/Personagem/Wizard/wizard.view.jsx`
- `Frontend/src/Pages/Personagem/Wizard/components/WizardChat.jsx`
- `Frontend/src/Pages/Personagem/Wizard/components/WizardProgressBar.jsx`
- `Frontend/src/Pages/Personagem/Wizard/components/WizardPreview.jsx`
- `Frontend/src/Pages/Personagem/Wizard/components/AttributeDistributor.jsx`

## Escopo inicial

| Tipo | Tema | Documento |
|------|------|-----------|
| Discussao | Wizard de Personagem v2 | [discussoes/01-wizard-personagem-v2.md](./discussoes/01-wizard-personagem-v2.md) |

## Principios

1. O wizard deve ser `wizard-first` e `chat-assisted`, nao `chat-blocked`.
2. A UI local e a fonte primaria de estado da criacao; a conversa com o Mestre Criador deve orientar, nao sequestrar o fluxo.
3. Mudancas estruturais na build devem invalidar confirmacoes derivadas quando necessario.
4. O usuario deve conseguir voltar, revisar, corrigir e retomar sem perder contexto util.
5. Confirmar atributos e salvar personagem nao devem depender de encontrar a ultima mensagem do chat.
6. O contrato atual de criacao de personagem deve ser preservado sempre que possivel.
7. Refatoracao estrutural so entra depois que as correcoes de fluxo e consistencia estiverem fechadas.
8. Estado visitado e estado concluido nao sao a mesma coisa; o wizard deve distinguir os dois.
9. Bonus e atributos finais devem ser derivados de um estado base confiavel, nao de somas e subtracoes oportunistas.

## Frentes candidatas

1. `B5-F01` Fluxo explicito de etapas e desacoplamento do chat
2. `B5-F02` Navegacao reversivel e controles persistentes
3. `B5-F03` Rascunho e retomada de sessao do wizard
4. `B5-F04` Busca, comparacao e selecao orientada de catalogos
5. `B5-F05` Consistencia de atributos, bonus e dependencias da build
6. `B5-F06` Revisao final, pendencias e salvamento
7. `B5-F07` Refatoracao interna do wizard
8. `B5-D01` Spike de contrato minimo entre frontend e Mestre Criador
9. `B5-D02` Telemetria de abandono, retomada e conversao do wizard

## Dependencias

1. O contrato atual de `mestreCriadorService.interagir()` continua sendo a base inicial.
2. O fluxo atual de criacao via `personagemService.create()` continua sendo a saida oficial.
3. O backlog-5 nao depende do backlog-4 para iniciar, mas deve respeitar a direcao geral de evolucao incremental adotada nos backlogs anteriores.
4. Qualquer ajuste de backend derivado do wizard deve ser opcional e backward-compatible.

## Compatibilidade com backlogs abertos

1. `backlog-2`: `B5-F03` amplia o antigo problema de perder progresso; nao duplica a frente de autosave, evolui para retomada real.
2. `backlog-3`: nao conflita com a evolucao do Mestre IA, desde que o wizard continue consumindo o contrato atual do `Mestre Criador`.
3. `backlog-4`: nao depende do schema do Mestre principal e nao deve introduzir reescrita de contrato por efeito colateral.
4. `review-3`: herda o mesmo principio de preservar contratos publicos e evitar novas fontes de verdade sem decisao formal.

## Marcos recomendados

1. `Marco 1` - Consistencia de estado
   - `B5-F01`
   - `B5-F05`
   - `B5-F03`
2. `Marco 2` - Navegacao e persistencia de acoes
   - `B5-F02`
   - `B5-F06`
3. `Marco 3` - Busca, revisao e limpeza estrutural
   - `B5-F04`
   - `B5-F07`
   - `B5-D01`
   - `B5-D02`

## Fora de escopo imediato

- reescrever o wizard inteiro do zero;
- trocar a API de criacao de personagem sem necessidade real;
- transformar todo o wizard em geracao automatica por IA;
- introduzir persistencia nova no backend so para o draft do wizard;
- reconstruir historico antigo de chat como se fosse conversa real restaurada;
- atacar polimento visual pesado antes de corrigir fluxo e consistencia.
