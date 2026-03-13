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

---

## Auditoria (2026-03-13)

**Completude: ~15%** (analista: 10%, revisor: 15%)

### Feitos (parciais)

- Distincao `initial` vs `regenerate` implementada (`blueprintService.js:346-351`)
- Temperaturas diferenciadas: 0.3 (initial) vs 0.7 (regenerate)
- `buildRegenerationBlock` (L82-145) com logica anti-repeticao sofisticada (filtra nomes canonicos, NPCs, locais, tesouros)
- Estrutura normalizada do roteiro bem definida (`normalizeBlueprintStructure`, L274-342) — facilitaria comparacao futura

### Pendentes

| # | Requisito | Status |
|---|-----------|--------|
| 1 | Modos de geracao criativos (sombrio, exploracao, intriga, etc.) | Nao iniciado |
| 2 | Metadados de versao salvos junto da geracao (modo, modelo, temperatura, timestamp) | Nao iniciado |
| 3 | Tabela `roteiro_versoes` no schema Prisma | Nao iniciado |
| 4 | Historico de propostas (versao anterior e sobrescrita hoje) | Nao iniciado |
| 5 | Comparacao side-by-side de propostas | Nao iniciado |
| 6 | Workflow de aprovacao (marcar versao como "ativa") | Nao iniciado |
| 7 | Seletor de modo no frontend (hoje so botao "Regenerar") | Nao iniciado |

### Gap por camada

- **Dados**: falta tabela `roteiro_versoes` (id, historia_id, versao, modo, metadados, roteiro_json, ativa, criado_em)
- **Servico**: falta enum de modos criativos, mapeamento modo->prompt, versionamento sem sobrescrita
- **Controller/Routes**: falta parametro `mode` no POST, GET versoes, PUT ativar, GET comparar
- **Frontend**: falta seletor de modo, historico de versoes, comparacao visual, badge de versao ativa
