# F-03 - Controles de produto para IA

## Tipo

Feature

## Prioridade

Media

## Contexto

Hoje o motor de IA ja gera:

- prologo
- roteiro
- imagem
- audio
- narrativa do mestre

Mas a camada de produto ainda e rasa em pontos importantes. Exemplo direto: regenerar roteiro deveria permitir modos explicitos como:

- primeira proposta
- proposta alternativa real
- versao mais sombria
- versao mais politica
- versao com foco em exploracao
- versao com foco em intriga

No estado atual, muita direcao criativa ainda depende de prompt interno e nao de intencao clara do usuario.

## Problema atual

- pouca direcao criativa explicita na UI
- baixa rastreabilidade de "qual modo gerou esta versao"
- dificil comparar versoes
- regeneracao pode parecer apenas uma reescrita do mesmo blueprint

## Como deve ser

O sistema deve expor controles de produto sobre a IA, nao apenas botoes de "gerar novamente".

Isso significa:

- modo de geracao declarado
- metadado salvo junto da versao
- comparacao de propostas
- historico de variantes
- aprovacao manual de uma versao como "ativa"

## Escopo

- adicionar modos de geracao de roteiro
- salvar metadados da versao gerada
- exibir modo atual e historico de variacoes
- permitir comparar rapidamente duas propostas

## Fora de escopo

- treinar modelo proprio
- criar versionamento universal para qualquer entidade do sistema

## Arquivos mais impactados

- `Backend/services/blueprintService.js`
- `Backend/controllers/historia/historiaController.js`
- `Backend/Model/Historia.js`
- `Frontend/src/Pages/Historia/Ver/*`
- `Frontend/src/components/RoteiroViewer.jsx`

## Plano de execucao

1. Declarar modos suportados no backend.
2. Salvar metadados de geracao no roteiro ou em estrutura de versoes.
3. Expor no frontend um seletor de modo antes da regeneracao.
4. Permitir manter a versao atual ativa e guardar propostas alternativas.
5. Adicionar comparacao basica entre sinopse, antagonista, locais e NPCs.
6. Marcar claramente qual versao esta aprovada para o jogo.

## Criterios de aceite

- O usuario entende qual tipo de roteiro esta pedindo.
- O sistema consegue produzir propostas realmente diferentes quando o modo pede isso.
- E possivel comparar e escolher uma versao antes de substituir a ativa.

## Handoff para outra instancia

Objetivo: transformar a geracao de roteiro em um produto de direcao criativa, nao apenas em um botao de regenerar.

Contexto atual:

- o backend ja gera roteiro e agora diferencia `initial` de `regenerate`
- o frontend ainda nao oferece modos claros de variacao
- nao existe UX de comparacao ou historico de propostas

O que fazer:

- desenhar e implementar modos de geracao
- registrar metadados da versao
- criar UI de comparacao e aprovacao

Entregaveis:

- modos de roteiro expostos ao usuario
- historico de propostas
- comparacao visual basica

## Observacao de produto

Esse item e um salto de qualidade para criacao assistida. Ele reduz frustracao e aumenta sensacao de autoria.
