# F-01 - Fechar contrato publico do websocket

## Tipo

Feature

## Prioridade

Alta

## Contexto

O runtime do jogo evoluiu bastante: hoje a experiencia principal gira em torno de eventos como `mensagem_para_mestre`, `mestre_solicita_dados`, `turno_estado_atualizado`, `resultado_teste`, `acao_mestre` e `mensagem_roleplay`.

O problema e que a documentacao publica ainda carrega contratos antigos como `send_message` e `player_action`, e isso reintroduz ambiguidade. O resultado pratico e simples: uma nova instancia que leia apenas a documentacao tende a implementar um cliente errado.

Arquivos de referencia:

- `Backend/websocket/socketManager.js`
- `Backend/websocket/README.md`
- `Backend/websocket-events-documentation.json`
- `Frontend/src/store/socket/listeners.js`

## Problema atual

- O runtime ativo ja nao usa o mesmo vocabulário da documentacao.
- Existem eventos antigos ainda descritos como principais.
- O frontend atual ja segue um fluxo mais novo, mas isso nao esta refletido em uma especificacao publica unica.
- Isso aumenta custo de onboarding, risco de cliente divergente e regressao em futuras limpezas de legado.

## Como deve ser

O projeto deve ter um contrato websocket unico, enxuto e versionado para o fluxo do jogo.

Esse contrato precisa dizer com clareza:

- quais eventos o cliente pode emitir
- quais eventos o servidor responde
- qual payload e obrigatorio
- qual campo e legado e qual campo e canonico
- qual evento e apenas informativo e qual evento e autoritativo

## Escopo

- revisar o conjunto real de eventos em uso
- marcar o contrato canonico do jogo
- remover ou deprecar eventos legados da documentacao
- alinhar exemplos, nomes e payloads
- documentar a diferenca entre eventos live e historico persistido

## Fora de escopo

- redesenhar o motor do jogo
- criar nova camada de transporte
- mudar protocolo de autenticacao

## Arquivos mais impactados

- `Backend/websocket/socketManager.js`
- `Backend/websocket/README.md`
- `Backend/websocket-events-documentation.json`
- `Frontend/src/store/socket/listeners.js`
- `Frontend/src/store/socket/send.js`

## Plano de execucao

1. Inventariar os eventos emitidos e escutados hoje.
2. Definir a lista canonica de eventos de gameplay.
3. Marcar explicitamente no backend quais eventos sao legados.
4. Atualizar o README websocket com o fluxo atual.
5. Atualizar `websocket-events-documentation.json`.
6. Remover exemplos antigos que ensinam `send_message` e `player_action`.
7. Revisar o frontend para garantir que ele consome apenas o contrato canonico.
8. Adicionar uma secao "campos de compatibilidade temporaria" para guiar a remocao segura.

## Criterios de aceite

- Uma nova instancia consegue implementar o cliente do jogo lendo apenas a documentacao atualizada.
- A documentacao deixa claro que `turno_estado_atualizado` e o estado autoritativo.
- `mestre_solicita_dados` aparece como o evento live canonico de teste.
- Eventos legados ficam marcados como deprecados ou removidos do guia principal.

## Handoff para outra instancia

Objetivo: fechar o contrato publico do websocket para refletir o runtime atual do jogo.

Contexto atual:

- o backend principal esta em `Backend/websocket/socketManager.js`
- a documentacao antiga esta em `Backend/websocket/README.md`
- o catalogo estruturado de eventos esta em `Backend/websocket-events-documentation.json`
- o frontend consome o contrato em `Frontend/src/store/socket/listeners.js`

O que fazer:

- comparar runtime e documentacao
- declarar um contrato canonico unico
- atualizar README e JSON de eventos
- remover do fluxo principal referencias a `send_message` e `player_action`

Entregaveis:

- documentacao websocket revisada
- lista canonica de eventos
- notas de compatibilidade/deprecacao

## Observacao de produto

Esse item e base para os proximos. Se o contrato publico continuar difuso, qualquer modularizacao do motor ou observabilidade futura vai herdar ambiguidade.

---

## Auditoria (2026-03-13)

**Completude: ~89%** (analista: 92%, revisor: 89%)

### Feitos

- Contrato JSON v2.1.0 completo (`websocket-events-documentation.json`, 1063 linhas)
- `canonical_gameplay_path` definido (8 client + 10 server)
- `turno_estado_atualizado` marcado authoritative (JSON:552)
- `mestre_solicita_dados` canonical (JSON:568)
- 20 eventos legacy catalogados com status explicito
- 5 legacy field aliases documentados
- README.md atualizado com fluxo canonico
- Exemplos usando apenas eventos canonicos (sem `send_message`/`player_action`)
- Combate completo documentado (7 eventos)
- `server_message` documentado
- `pong` e `room_users` removidos do `test-websocket.html`

### Pendentes (resolvidos 2026-03-13)

| # | Item | Resolucao |
|---|------|-----------|
| P1 | `dice_roll` echo (server->client) nao documentado | **Resolvido** — adicionado em `server_to_client.messages.dice_roll` com payload completo |
| P2 | `rpg_action` echo (server->client) nao documentado | **Resolvido** — adicionado em `server_to_client.messages.rpg_action` com payload completo |
| P3 | `rate_limit_exceeded` documentado como canonical mas nunca emitido | **Resolvido** — reclassificado para `planned` com nota explicativa |
| P4 | Frontend escuta 3 listeners orfaos (`room_users`, `connection_error`, `authentication_error`) | **Resolvido** — listeners removidos de `listeners.js` e do array `internalEvents` |
| P5 | Backend sem annotations inline nos handlers | Baixa prioridade — info existe no JSON, nao bloqueia |

### Completude atualizada: ~97%

Unico gap remanescente: P5 (annotations inline nos handlers — cosmético, não funcional).

### Riscos (atualizados)

- Divergencia JSON vs runtime sem validacao automatica em CI — novo emit pode escapar da documentacao
- `rate_limit_exceeded` agora corretamente marcado como `planned` — frontend listener mantido para quando for implementado
