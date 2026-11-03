# D-01 - Wizard de Personagem v2

## Contexto

O wizard atual ja tem uma base funcional:

- fluxo guiado por etapas;
- catalogos de raca, classe, vantagens e desvantagens;
- distribuicao de atributos;
- auto-save em `localStorage`;
- conversa com o Mestre Criador para orientar escolhas.

Mas a implementacao atual mistura demais:

- estado local do wizard;
- conversa de chat;
- validacao de build;
- confirmacao de atributos;
- persistencia de draft;
- salvamento final.

Na pratica isso gera um wizard que funciona, mas cobra custo alto de manutencao e de experiencia de uso.

## Estado atual relevante

### Model

Arquivo principal:

- `Frontend/src/Pages/Personagem/Wizard/wizard.model.js`

Hoje esse arquivo concentra:

- estado das etapas;
- estado do personagem;
- carga de catalogos;
- draft em `localStorage`;
- comunicacao com `mestreCriadorService`;
- validacao de vantagens e desvantagens;
- aplicacao de bonus;
- salvamento final.

Isso e funcional, mas caro de evoluir.

### View

Arquivos relevantes:

- `Frontend/src/Pages/Personagem/Wizard/wizard.view.jsx`
- `Frontend/src/Pages/Personagem/Wizard/components/WizardChat.jsx`
- `Frontend/src/Pages/Personagem/Wizard/components/WizardProgressBar.jsx`
- `Frontend/src/Pages/Personagem/Wizard/components/WizardPreview.jsx`

Hoje a experiencia visual tem estes limites:

- barra de progresso majoritariamente informativa;
- confirmacao e salvamento presos ao fluxo do chat;
- ficha de revisao util, mas ainda fraca como area de correcao;
- busca restrita a raca e classe;
- componente `WizardPreview.jsx` existente, mas nao integrado ao fluxo principal.

## Compatibilidade com backlogs abertos

### Com `backlog-2`

- o problema original de perder progresso ja foi identificado antes;
- aqui a frente correta deixa de ser apenas `autosave` e passa a ser `retomada real de sessao`.

### Com `backlog-3`

- o wizard nao deve depender do pipeline principal de segmentos, voz e memoria do Mestre IA;
- o `Mestre Criador` continua sendo consumido pelo contrato atual, salvo extensoes opcionais e compativeis.

### Com `backlog-4`

- o wizard nao deve puxar reescrita de schema do backend;
- qualquer ajuste de contrato do `Mestre Criador` deve ser opcional, backward-compatible e posterior ao lote principal de frontend.

## Problemas reais a resolver

### P1 - O chat esta dirigindo demais o wizard

Hoje selecionar sugestao local ja dispara mensagem para o Mestre Criador.

Consequencia:

- a UX local fica acoplada ao chat;
- editar escolhas fica mais dificil;
- revisar ou trocar decisoes gera fluxo confuso;
- aumenta o risco de mandar estado antigo ou parcial para o backend.

Direcao:

- o wizard precisa assumir o estado e a progressao;
- o chat deve virar apoio, recomendacao e justificativa.

### P2 - Nao ha navegacao real de etapas

Hoje o usuario enxerga progresso, mas nao tem uma experiencia clara de:

- voltar para uma etapa especifica;
- revisar o que falta;
- editar uma etapa sem depender de novos turnos de chat.

Direcao:

- criar navegacao explicita por etapa com regras de bloqueio;
- distinguir etapa visitada de etapa concluida;
- usar estrutura serializavel para persistir esse estado.

### P3 - O draft retoma dados, mas nao retoma experiencia

Hoje existe auto-save, mas a retomada ainda e incompleta.

Consequencia:

- o usuario pode cair numa etapa avancada com contexto de conversa reconstruido de forma pobre;
- a reentrada no wizard parece fria ou incoerente.

Direcao:

- draft precisa guardar mais contexto util;
- a volta ao wizard deve oferecer restaurar, descartar ou recomecar;
- a experiencia retomada deve parecer continuidade, nao um reset parcial;
- a retomada nao deve tentar fabricar historico completo de conversa que nao foi persistido.

### P4 - A confirmacao de atributos pode ficar invalida

Hoje a confirmacao de atributos e uma etapa derivada da build.

Se a build mudar depois, a confirmacao pode ficar obsoleta.

Direcao:

- qualquer alteracao estrutural relevante deve invalidar bonus e confirmacoes dependentes;
- o wizard deve recalcular pendencias automaticamente;
- `atributosBase` e `atributosFinal` devem ser tratados como estados conceitualmente distintos.

### P5 - Acoes criticas estao escondidas no chat

Hoje confirmar atributos e criar personagem aparecem no bloco da ultima resposta do Mestre.

Consequencia:

- descoberta pior;
- dependencia de scroll;
- menos sensacao de fechamento e controle.

Direcao:

- mover acoes principais para rodape fixo ou area persistente do wizard;
- usar o chat como contexto, nao como container de botao critico;
- preferir footer `sticky` dentro do wizard, nao `fixed` global.

### P6 - Busca e comparacao ainda sao rasas

Hoje a busca esta forte apenas para raca e classe.

Direcao:

- estender busca para vantagens e desvantagens;
- permitir comparacao rapida entre opcoes;
- exibir impacto de custo e bonus antes da confirmacao;
- manter o primeiro passo da busca no proprio layout atual antes de abrir escopo para modal dedicado.

### P7 - Ha divida estrutural clara

Hoje o wizard sofre com:

- arquivo-modelo grande demais;
- responsabilidades misturadas;
- componente de preview solto;
- baixo isolamento entre fluxo, validacao e chat.

Direcao:

- quebrar em hooks menores;
- reduzir acoplamento entre estado e interface;
- remover ou reincorporar componentes orfaos.

## Proposta de organizacao do backlog-5

### B5-F01 - Fluxo explicito e desacoplamento do chat

Objetivo:

- separar a progressao de etapa da troca de mensagens com o Mestre Criador.

Entregas:

- camada de orquestracao do wizard;
- evento local para selecionar opcao sem obrigar envio imediato ao chat;
- transicoes explicitas entre etapas;
- dirty flags para detectar build alterada.

Arquivos candidatos:

- `Frontend/src/Pages/Personagem/Wizard/wizard.model.js`
- `Frontend/src/Pages/Personagem/Wizard/wizard.view.jsx`
- `Frontend/src/Pages/Personagem/Wizard/components/WizardChat.jsx`

Criterios de aceite:

1. selecionar uma opcao local nao depende automaticamente de uma mensagem no chat;
2. a etapa atual pode avancar por regra local validada;
3. o chat continua funcionando como apoio sem ser a unica via de progresso;
4. `selecionarSugestao()` nao chama mais `enviarMensagem()` implicitamente.

### B5-F02 - Navegacao reversivel e controles persistentes

Objetivo:

- permitir revisao e correcao de etapas ja concluidas.

Entregas:

- progress bar clicavel ou lista lateral de etapas;
- botao de voltar etapa;
- footer `sticky` com acoes principais;
- indicadores claros de etapa concluida, em andamento e pendente.

Arquivos candidatos:

- `Frontend/src/Pages/Personagem/Wizard/components/WizardProgressBar.jsx`
- `Frontend/src/Pages/Personagem/Wizard/wizard.view.jsx`

Criterios de aceite:

1. o usuario pode voltar para etapa anterior sem perder o restante da ficha;
2. as acoes principais permanecem visiveis sem depender do scroll do chat;
3. a UI indica pendencias reais por etapa;
4. etapas futuras continuam bloqueadas;
5. `etapasVisitadas` e `etapasConcluidas` sao rastreadas separadamente em estrutura serializavel.

### B5-F03 - Draft e retomada do wizard

Objetivo:

- transformar auto-save em retomada real de sessao.

Entregas:

- modal ou banner de retomada ao detectar draft;
- opcao de continuar, descartar ou recomecar;
- restauracao do contexto minimo de experiencia;
- limpeza segura do draft ao salvar com sucesso.

Arquivos candidatos:

- `Frontend/src/Pages/Personagem/Wizard/wizard.model.js`
- `Frontend/src/Pages/Personagem/Wizard/wizard.view.jsx`

Criterios de aceite:

1. reabrir o wizard com draft salvo mostra escolha clara de retomada;
2. o usuario entende em que ponto parou;
3. descartar draft volta o wizard para um inicio limpo;
4. o chat restaurado usa mensagem local de retomada, sem tentar reconstruir historico real nao persistido.

### B5-F04 - Busca, comparacao e selecao orientada

Objetivo:

- reduzir custo cognitivo para escolher catalogos.

Entregas:

- busca para vantagens e desvantagens;
- comparacao rapida entre opcoes;
- exibicao de custo e bonus antes da selecao;
- filtros simples por perfil ou papel quando fizer sentido.

Arquivos candidatos:

- `Frontend/src/Pages/Personagem/Wizard/components/WizardChat.jsx`
- `Frontend/src/Pages/Personagem/Wizard/components/SuggestionCard.jsx`

Criterios de aceite:

1. o usuario consegue buscar qualquer categoria principal do wizard;
2. custo e impacto ficam visiveis antes da escolha;
3. a escolha de catalogos fica menos dependente de "gerar novas sugestoes";
4. a primeira versao da busca expandida reutiliza o painel atual, sem abrir dependencia de modal.

### B5-F05 - Consistencia de atributos e dependencias da build

Objetivo:

- garantir que a ficha final nao salve estado obsoleto.

Entregas:

- invalidacao automatica de bonus quando a build muda;
- recalculo de pendencias;
- confirmacao de atributos com estado derivado claro;
- trava de salvamento quando houver confirmacao desatualizada.

Arquivos candidatos:

- `Frontend/src/Pages/Personagem/Wizard/wizard.model.js`
- `Frontend/src/Pages/Personagem/Wizard/components/AttributeDistributor.jsx`

Criterios de aceite:

1. mudar vantagem, desvantagem, raca ou classe invalida confirmacao dependente quando necessario;
2. o usuario entende por que precisa reconfirmar atributos;
3. o personagem nao e salvo com bonus incoerentes;
4. a implementacao usa `atributosBase` como fonte confiavel para derivar bonus, sem depender de subtrair bonus manualmente do valor final como estrategia principal.

### B5-F06 - Revisao final e salvamento

Objetivo:

- transformar a ficha lateral em area de decisao final.

Entregas:

- checklist de pendencias;
- resumo por etapa;
- realce de campos faltantes ou conflituosos;
- CTA final de criar personagem em area persistente;
- ficha fixa em desktop amplo e colapsavel em mobile.

Arquivos candidatos:

- `Frontend/src/Pages/Personagem/Wizard/wizard.view.jsx`
- `Frontend/src/Pages/Personagem/Wizard/components/WizardPreview.jsx`
- `Frontend/src/components/PersonagemPreviewCard.jsx`

Criterios de aceite:

1. a revisao final mostra exatamente o que falta;
2. o usuario consegue remover ou editar escolhas de forma clara;
3. o salvamento transmite estado final e conclusivo;
4. em desktop, a ficha lateral permanece visivel sem sacrificar o fluxo principal de leitura.

### B5-F07 - Refatoracao interna do wizard

Objetivo:

- reduzir custo de manutencao depois das correcoes de fluxo.

Entregas:

- separar hooks como `useWizardDraft`, `useWizardFlow`, `useWizardBuild` e `useWizardCatalogs`;
- reduzir tamanho e responsabilidade de `wizard.model.js`;
- remover ou reincorporar `WizardPreview.jsx`;
- melhorar testabilidade da logica.

Arquivos candidatos:

- `Frontend/src/Pages/Personagem/Wizard/wizard.model.js`
- novos hooks em `Frontend/src/Pages/Personagem/Wizard/`

Criterios de aceite:

1. estado, regras e comunicacao externa ficam mais isolados;
2. os componentes passam a depender menos de props extensas;
3. futuras evolucoes do wizard reduzem risco de regressao;
4. a meta de refatoracao e separar responsabilidades, nao atingir um numero arbitrario de linhas.

### B5-D01 - Spike de contrato minimo com o Mestre Criador

Objetivo:

- decidir ate onde o backend deve orientar o wizard sem virar dono do fluxo.

Perguntas a responder:

1. quais sugestoes devem continuar vindo do backend;
2. quais escolhas podem ser 100% locais;
3. se faz sentido introduzir `acoes` ou `intents` mais estruturadas no retorno do Mestre Criador;
4. como manter compatibilidade com o contrato atual.

Arquivos candidatos:

- `Frontend/src/Pages/Personagem/Wizard/wizard.model.js`
- service do Mestre Criador no frontend
- endpoint atual do backend associado ao wizard

Saida esperada:

- decisao arquitetural simples, sem big bang;
- nenhuma obrigatoriedade de mudanca de backend para fechar os lotes principais do `backlog-5`.

### B5-D02 - Telemetria e validacao de uso

Objetivo:

- medir se as mudancas realmente melhoram conclusao do wizard.

Metricas candidatas:

- abandono por etapa;
- retomada de draft;
- tempo medio ate salvamento;
- uso de busca;
- numero de alteracoes apos confirmacao de atributos;
- taxa de erro ao salvar.

## Lotes recomendados

### Lote 1 - Fluxo e estado

Ordem:

1. `B5-F01` Fluxo explicito e desacoplamento do chat
2. `B5-F05` Consistencia de atributos e dependencias da build
3. `B5-F03` Draft e retomada

Motivo:

- concentra o nucleo da consistencia do wizard;
- reduz risco de corrigir visual antes de corrigir regra.

### Lote 2 - Interface e navegacao

Ordem:

1. `B5-F02` Navegacao reversivel e controles persistentes
2. `B5-F06` Revisao final e salvamento
3. `B5-F04` Busca, comparacao e selecao orientada

Motivo:

- depois do estado estabilizado, a interface pode expor melhor os controles;
- evita refazer UI para acomodar regra instavel.

### Lote 3 - Refatoracao estrutural

Ordem:

1. `B5-F07` Refatoracao interna
2. `B5-D01` Spike de contrato minimo
3. `B5-D02` Telemetria e validacao

Motivo:

- so vale quebrar `wizard.model.js` depois que o comportamento estiver estavel;
- spike de contrato e telemetria entram como apoio tardio, nao como bloqueio do fluxo principal.

## Paralelizacao recomendada

Nao vale colocar muitos agentes ao mesmo tempo.

Recomendacao:

- `2 agentes` em paralelo como configuracao principal;
- `3 agentes` no maximo, se houver coordenacao forte.

Divisao sugerida:

- Agente 1: fluxo, estado, consistencia e draft
- Agente 2: navegacao, busca, revisao e acoes persistentes
- Agente 3: refatoracao interna, apenas depois de estabilizar as correcoes principais

Restricao importante:

- nao colocar dois agentes mexendo ao mesmo tempo em `wizard.model.js`.

## Fora de escopo imediato

- redesign visual completo antes de resolver o fluxo;
- nova API de criacao de personagem sem evidencia de necessidade;
- persistencia server-side do draft como primeira resposta;
- substituir toda a orientacao do Mestre Criador por geracao automatica fechada.
