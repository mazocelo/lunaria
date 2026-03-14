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

## Auditoria (2026-03-14, atualizado pos-R12)

**Completude: ~100%**

### Feitos

| # | Requisito | Status | Rodada |
|---|-----------|--------|--------|
| 1 | Distincao `initial` vs `regenerate` | **Feito** | Pre-backlog |
| 2 | Temperaturas diferenciadas por modo (`MODE_TEMPERATURES`) | **Feito** | R8 |
| 3 | Anti-repeticao (`buildRegenerationBlock`) | **Feito** | Pre-backlog |
| 4 | Modos de geracao criativos (darker, exploration, intrigue, political) | **Feito** | R8 |
| 5 | Metadados de versao (modo, modelo, temperatura, timestamp) | **Feito** | R8 |
| 6 | Tabela `roteiro_versoes` no schema Prisma | **Feito** | R8 |
| 7 | Historico de propostas com versionamento | **Feito** | R8 |
| 8 | Workflow de aprovacao (marcar versao como "ativa") | **Feito** | R8 |
| 9 | Seletor de modo no frontend | **Feito** | R8 |
| 10 | Fix URL mismatch (`/roteiro-versoes` aliases) | **Feito** | R10 |
| 11 | Endpoint detalhe de versao (`GET /:id/roteiro-versoes/:versaoId`) | **Feito** | R10 |
| 12 | Frontend service `obterVersaoRoteiro()` | **Feito** | R10 |
| 13 | Modal side-by-side com comparacao visual | **Feito** | R12 |
| 14 | Approval workflow — campos `status`, `reviewer_id`, `reviewed_at`, `review_comment` em `roteiro_versoes` | **Feito** | R13 |
| 15 | `PATCH /:id/roteiro-versoes/:versaoId/status` — endpoint de transicao de status | **Feito** | R13 |
| 16 | Transicoes `draft → pending → approved/rejected` com auto-ativacao ao aprovar | **Feito** | R13 |

### Pendentes

Nenhum item pendente.

### Criterios de aceite vs estado atual

| Criterio | Status |
|----------|--------|
| Usuario entende qual tipo de roteiro esta pedindo | **Atendido** (seletor de modo com 4 modos criativos + regenerate) |
| Sistema produz propostas realmente diferentes | **Atendido** (diretivas por modo + anti-repeticao + temperaturas diferenciadas) |
| Possivel comparar e escolher versao antes de substituir | **Atendido** (modal side-by-side com diff por secao, metadados, botao "Ativar esta versao") |
