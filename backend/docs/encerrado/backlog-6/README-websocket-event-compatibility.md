# Backlog-6: Auditoria de Compatibilidade WebSocket — Backend ↔ Frontend

> **Data**: 2026-03-14
> **Escopo**: Todos os eventos WebSocket emitidos pelo backend vs listeners registrados no frontend
> **Arquivos principais**:
> - Backend: `Backend/websocket/engines/`, `Backend/websocket/handlers/`, `Backend/websocket/gateways/`, `Backend/websocket/utils/`, `Backend/helpers/acoesProcessor.js`
> - Frontend: `Frontend/src/store/socket/listeners.js`, `Frontend/src/store/socket/rooms.js`, `Frontend/src/store/socket/connection.js`, `Frontend/src/store/socket/send.js`, `Frontend/src/components/Jogo/Etapas/hooks/useSocketMirror.js`

---

## Resumo Executivo

| Severidade | Qtd | Descrição |
|------------|-----|-----------|
| **Alta** | 2 | Evento perdido afetando gameplay em tempo real |
| **Média** | 2 | State desatualizado ou timeout desnecessário |
| **Baixa** | 2 | Features legacy/não utilizadas |
| **Info** | 2 | Código morto ou feature planejada |

**Total: 8 incompatibilidades identificadas, 40+ eventos compatíveis.**

---

## BUG 1 — `status_jogo_alterado`: Backend emite, Frontend ignora

**Severidade: ALTA**

### O que é

Evento emitido quando o status do lobby muda (ex: `null` → `esperando`). Permite ao frontend saber que a sala de espera mudou de estado.

### Backend — Emissão

**Arquivo**: `Backend/websocket/gateways/roomGateway.js:731-739`

```javascript
if (statusAnterior !== sessao.statusJogo && sm.io) {
  sm.sendToRoom(salaId, 'status_jogo_alterado', {
    statusJogo: sessao.statusJogo,     // string: null | 'esperando' | 'iniciado'
    totalJogadores: jogadoresAtuais.length,
    timestamp: Date.now()
  });
}
```

**Trigger**: Chamado dentro de `adicionarJogadorSessao()` quando `statusAnterior !== sessao.statusJogo`.

**Valores possíveis de `statusJogo`**:

| Valor | Onde é setado | Contexto |
|-------|---------------|----------|
| `null` | `sessionEngine.js:119` | Estado inicial da sessão |
| `'esperando'` | `roomGateway.js:719` | Primeiro jogador entra na sala |
| `'iniciado'` | `jogo.js:166` | Dono clica "Iniciar Jogo" (via REST) |

**Gap arquitetural**: A transição `esperando` → `iniciado` é feita via REST (`/jogo/start`) e **não emite** `status_jogo_alterado`. Apenas `aventura_iniciada` é emitida 2-3s depois.

### Frontend — Ausência

- **`listeners.js:24-40`**: Evento **não está** na lista `internalEvents`
- **Nenhum `socket.on('status_jogo_alterado')`** em todo o `Frontend/src/`
- **Nenhuma referência** a `statusJogo` em nenhum componente ou store

### Workaround atual (parcial)

O `EtapaSalaEspera.jsx` usa `room_joined` (uma vez ao entrar) e `aventura_iniciada` (ao iniciar jogo) para inferir estado. Não há atualização reativa durante o lobby.

### Impacto no usuário

| Cenário | O que acontece | Severidade |
|---------|----------------|------------|
| Jogador A entra, depois Jogador B | B não vê A até refresh | Média |
| Dono inicia jogo | Jogadores veem "Aguardando..." até `aventura_iniciada` (2-3s delay) | Alta |
| Reconexão durante lobby | Frontend não sabe se jogo já iniciou | Alta |

### Correção necessária

1. **Frontend**: Adicionar listener em `listeners.js` + handler em `EtapaSalaEspera.jsx`
2. **Backend**: Emitir `status_jogo_alterado` também em `/jogo/start` (jogo.js:166)
3. **Backend**: Incluir `statusJogo` no payload de `room_joined`

---

## BUG 2 — `combate_resultado_acao` tipo `status_dano`: DOT não atualiza HP no state

**Severidade: ALTA**

### O que é

Quando um jogador sofre dano por turno (veneno 1d4, queimadura 1d6), o backend emite `combate_resultado_acao` com `tipo: 'status_dano'`. O frontend só trata `ataque_jogador` e `ataque_monstro`.

### Backend — Emissão

**Arquivo**: `Backend/websocket/engines/combatEngine.js:208-224`

```javascript
// tipo: 'status_dano' — dano por turno de efeitos
sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_RESULTADO_ACAO, {
  tipo: 'status_dano',
  alvo: { userId: se.userId, nome: se.personagem },
  status: se.efeito,          // 'envenenado' | 'queimando'
  dano: se.dano,              // número (ex: 3)
  hpRestante: se.hpRestante,  // HP após dano
  hpMax: se.hpMax,
  timestamp: Date.now()
});

// Fallback: também emite combate_jogador_ferido
sm.sendToRoom(roomId, COMBAT_EVENTS.COMBATE_JOGADOR_FERIDO, {
  userId: se.userId,
  nome: se.personagem,
  hp_atual: se.hpRestante,
  hp_max: se.hpMax,
  derrotado: se.derrotado,
  fonte: se.efeito,
  timestamp: Date.now()
});
```

**Também emite `tipo: 'status_efeito'`** (linhas 203-207) quando status bloqueia ação:
```javascript
{
  tipo: 'status_efeito',
  personagem: se.personagem,
  userId: se.userId,
  status: se.efeito,          // 'paralisado' | 'atordoado' | 'congelado'
  mensagem: `${se.personagem} está ${se.efeito} e não pode agir!`,
  timestamp: Date.now()
}
```

### Constantes relevantes

**Arquivo**: `Backend/config/domainConstants.js`
```javascript
STATUS_IMPEDE_ACAO = ['atordoado', 'paralisado', 'congelado'];
STATUS_DANO_POR_TURNO = { envenenado: '1d4', queimando: '1d6' };
STATUS_PENALIDADE_ATAQUE = { cego: 5 };
```

### Frontend — Handler incompleto

**Arquivo**: `Frontend/src/store/socket/listeners.js:582-611`

```javascript
socket.on('combate_resultado_acao', (data) => {
  const dto = normalizeResultadoAcao(data);

  if (dto.tipo === 'ataque_jogador' && dto.alvo?.id) {
    // ✅ Atualiza HP do monstro
  }

  if (dto.tipo === 'ataque_monstro' && dto.alvo?.userId) {
    // ✅ Atualiza HP do jogador
  }

  // ❌ 'status_dano' → NÃO atualiza HP (só vai pro log)
  // ❌ 'status_efeito' → NÃO reflete impedimento visual

  set({ combateLog: [...combateLog, dto] });
});
```

**`normalizeResultadoAcao()` em `dtos.js:78-97`** assume payload de ataque (acertou, critico, esquivou) — campos inexistentes em `status_dano`.

### Mitigação existente

O backend emite `combate_jogador_ferido` como fallback para `status_dano`, que **atualiza HP corretamente** no frontend (listeners.js:626). Porém:
- Há 1-2ms de desync entre os dois eventos
- HP bar pode piscar brevemente
- `status_efeito` **não tem fallback** — impedimento só aparece no log compacto

### Impacto no usuário

| Cenário | Resultado | Severidade |
|---------|-----------|------------|
| Veneno causa 3 de dano | HP pisca brevemente (fallback funciona) | Baixa |
| Jogador paralisado | Só aparece no log, sem feedback visual claro | Média |
| BatalhaUI `LogEntry` | ✅ Renderiza corretamente `status_dano` e `status_efeito` | OK |

### Correção necessária

1. **Frontend `listeners.js`**: Adicionar branches para `status_dano` e `status_efeito`
2. **Frontend `dtos.js`**: Normalizer deve aceitar payload sem campos de ataque

---

## BUG 3 — `acao_mestre`: 27 subtipos sem state update

**Severidade: MÉDIA**

### O que é

O evento `acao_mestre` é emitido com 31 subtipos distintos. O frontend atualiza state para apenas 4 deles, mas exibe mensagem para todos via `useSocketMirror`.

### Backend — Todos os 31 subtipos

**Origem principal**: `Backend/helpers/acoesProcessor.js` (26 tipos) + `Backend/websocket/engines/masterNarrationEngine.js` (3 auto-triggered) + `Backend/websocket/engines/turnEngine.js` (1 tipo) + `Backend/websocket/engines/combatEngine.js` (1 tipo)

#### Subtipos com state update no frontend (4/31) ✅

| Subtipo | Payload chave | State atualizado |
|---------|---------------|------------------|
| `curado` | `hp_restaurado`, `hp_atual`, `hp_max` | `combateJogadores[userId].hp_atual` |
| `dano_recebido` | `dano`, `elemento`, `hp_atual`, `derrotado`, `imune` | `combateJogadores[userId].{hp_atual, status}` |
| `status_aplicado` | `status`, `duracao` | `combateJogadores[userId].status_efeitos[]` push |
| `status_removido` | `status` | `combateJogadores[userId].status_efeitos[]` filter |

#### Subtipos com mensagem mas SEM state update (27/31) ⚠️

**Habilidades & Magia:**

| Subtipo | Payload | Impacto sem state update |
|---------|---------|--------------------------|
| `habilidade_usada` | `nome`, `habilidade_id`, `custo_mana`, `cooldown_turnos`, `dano_base`, `elemento` | Mana/cooldown não reflete na UI |
| `habilidade_bloqueada` | `nome`, `motivo` (cooldown/mana_insuficiente), `mana_atual`, `custo` | Info — só mensagem |
| `magia_conjurada` | `nome`, `magia_id`, `custo_mana`, `usa_concentracao`, `concentracao_anterior_quebrada` | Mana/concentração não reflete |
| `magia_bloqueada` | `nome`, `motivo`, `mana_atual`, `custo` | Info — só mensagem |
| `concentracao_quebrada` | `magia`, `motivo` (nova_concentracao/expirou/narrativa) | Concentração não limpa na UI |

**Vantagens & Desvantagens:**

| Subtipo | Payload | Impacto |
|---------|---------|---------|
| `vantagem_aplicada` | `vantagem`, `bonus` | Info — só mensagem |
| `desvantagem_ativada` | `desvantagem`, `penalidade` | Info — só mensagem |
| `desvantagem_teste_requerido` | `desvantagem`, `dc`, `atributo`, `penalidade` | Teste requerido não sinalizado |

**Efeitos & Status:**

| Subtipo | Payload | Impacto |
|---------|---------|---------|
| `efeito_aplicado` | `efeito`, `duracao`, `dano_por_turno`, `cura_por_turno` | DOT/HOT não trackado |
| `efeito_removido` | `efeito` | Efeito não limpo da UI |
| `efeitos_expirados` | `personagem`, `efeitos[]` | **Status ficam "presos" na UI** |
| `efeitos_terreno_expirados` | `efeitos[]` | Terreno não limpa |

**Itens & Equipamento:**

| Subtipo | Payload | Impacto |
|---------|---------|---------|
| `item_recebido` | `item` {id, nome, tipo, elemento, raridade} | **Inventário não atualiza** (notificação ✅) |
| `item_removido` | `item` {nome} | **Inventário não atualiza** (notificação ✅) |
| `equipamento_danificado` | `item`, `severidade` (danificado/destruido), `motivo` | Equip não reflete dano |

**Progressão & XP:**

| Subtipo | Payload | Impacto |
|---------|---------|---------|
| `xp_recebido` | `xp`, `xp_total_sessao`, `motivo` | XP não trackado na UI (evento `level_up` separado funciona) |

**Terreno & Cenário:**

| Subtipo | Payload | Impacto |
|---------|---------|---------|
| `terreno_alterado` | `terreno`, `terreno_obj`, `efeito`, `duracao` | Terreno não exibido |
| `cenario_mudado` | `cenario`, `cenario_anterior`, `ambiente`, `hora` | Cenário não atualiza |
| `dano_ambiental` | `dano`, `elemento`, `fonte`, `ignora_armadura`, `hp_atual`, `derrotado`, `imune` | **HP não atualiza** (sem fallback!) |

**Combate tático:**

| Subtipo | Payload | Impacto |
|---------|---------|---------|
| `personagem_estabilizado` | `curador`, `hp_atual`, `hp_max` | **HP não atualiza de 0→1+** |
| `boss_fase_alterada` | `boss`, `fase_atual`, `fase_anterior` | Boss phase não reflete |
| `missao_batalha_registrada` | `missao`, `batalha_grande` | Missão não exibida |

### Subtipos críticos (requerem state update)

1. **`efeitos_expirados`** — Status efeitos ficam visualmente "presos" até próximo `combate_estado`
2. **`dano_ambiental`** — HP não atualiza (não há fallback `combate_jogador_ferido`)
3. **`personagem_estabilizado`** — Jogador aparece "derrotado" quando na verdade foi estabilizado
4. **`item_recebido` / `item_removido`** — Inventário desatualizado até refresh

### Correção necessária

1. **Prioridade 1**: Adicionar state update para `dano_ambiental`, `personagem_estabilizado`, `efeitos_expirados`
2. **Prioridade 2**: Adicionar state update para `item_recebido`, `item_removido`, `equipamento_danificado`
3. **Prioridade 3**: Considerar tracking de mana/cooldown/concentração no frontend

---

## BUG 4 — `join_room_error` / `leave_room_error` / `authentication_error`: Listeners órfãos

**Severidade: MÉDIA (funcional, mas com fallback ineficiente)**

### O que é

O frontend registra `socket.once()` para 3 eventos de erro específicos que o backend **nunca emite**. O backend usa o evento genérico `error` para todos os casos.

### Frontend — Promise flows

**Arquivo**: `Frontend/src/store/socket/connection.js:97-141` (authenticate)
**Arquivo**: `Frontend/src/store/socket/rooms.js:7-79` (joinRoom), `rooms.js:82-138` (leaveRoom)

Cada operação registra 3 listeners:

```javascript
// Padrão em todas as 3 operações:
socket.once('room_joined', onJoined);           // ✅ Success path
socket.once('join_room_error', onError);         // ❌ NUNCA dispara
socket.once('error', onGenericError);            // ✅ Fallback que FUNCIONA

const timeout = setTimeout(() => {
  reject(new Error(`Timeout após ${configs.ROOM_TIMEOUT}ms`));
}, configs.ROOM_TIMEOUT);                        // 10000ms
```

### Backend — O que realmente acontece

**Arquivo**: `Backend/websocket/handlers/authHandler.js`
```javascript
// Auth falha → emite 'error', NÃO 'authentication_error'
socket.emit('error', { message: 'Token inválido ou expirado' });  // linhas 29, 41, 157
```

**Arquivo**: `Backend/websocket/gateways/roomGateway.js`
```javascript
// Join falha → emite 'error', NÃO 'join_room_error'
socket.emit('error', { message: 'Sala cheia', code: 'SALA_LOTADA' });  // 11+ ocorrências
```

**Documentação**: `Backend/websocket-events-documentation.json:1064-1077` confirma:
```json
{ "event": "authentication_error", "status": "not_emitted_in_current_runtime", "replacement": "error" }
{ "event": "join_room_error",      "status": "not_emitted_in_current_runtime", "replacement": "error" }
{ "event": "leave_room_error",     "status": "not_emitted_in_current_runtime", "replacement": "error" }
```

### Como funciona na prática

```
T+0ms     Frontend emite 'join_room'
T+5ms     Backend recebe, valida, encontra erro
T+10ms    Backend emite 'error' { message: 'Sala cheia' }
T+11ms    Frontend 'error' handler (onGenericError) dispara → Promise rejeita
T+12ms    cleanup() remove listeners órfãos ('join_room_error') + cancela timeout
```

**O sistema funciona** porque `socket.once('error', onGenericError)` captura o erro genérico. Os listeners órfãos são limpos pelo `cleanup()` após resolução.

### Impacto real

| Aspecto | Impacto |
|---------|---------|
| Tempo de resposta ao erro | ✅ Imediato (~10ms), não espera timeout |
| Memória | ✅ Listeners removidos por cleanup() |
| Código morto | ⚠️ 3 listeners + 3 handlers nunca executados |
| Risco | Baixo — funciona via fallback genérico |

### Correção necessária

**Opção A (limpeza)**: Remover os 3 listeners órfãos do frontend — simplifica o código sem mudança funcional.

**Opção B (completude)**: Backend emitir eventos específicos além do genérico — permite tratamento diferenciado por tipo de erro.

**Recomendação**: Opção A (limpeza). O padrão `success + error + timeout` é suficiente.

---

## BUG 5 — `rate_limit_exceeded`: Listener pronto, backend nunca emite

**Severidade: INFO (feature planejada)**

### O que é

O frontend tem um listener completo para rate limiting de WebSocket, mas o backend nunca implementou rate limiting em sockets.

### Frontend — Infraestrutura completa

**Arquivo**: `Frontend/src/store/socket/listeners.js:560-564`
```javascript
socket.on('rate_limit_exceeded', (data) => {
  set({ rateLimitExceeded: true });
  showGameNotification(data.message || 'Muitas mensagens! Aguarde um momento.', 'warning');
  setTimeout(() => set({ rateLimitExceeded: false }), data.retryAfter || 5000);
});
```

**State**: `states.js:46` → `rateLimitExceeded: false`

**Guard**: `index.js:46-67` → `canSendMessage()` checa `!rateLimitExceeded`

**Payload esperado**:
```javascript
{ message: string, retryAfter: number|null, remainingMs: number|null }
```

### Backend — Não implementado

- **Zero emissões** de `rate_limit_exceeded` em todo o Backend/
- **Documentação** (`websocket-events-documentation.json:935`): `"status": "planned"`
- **Rate limiting existe apenas via HTTP** (`express-rate-limit` em `app.js`)
- **Sem throttle em WebSocket** — jogadores podem spammar mensagens sem limite

### Impacto

Nenhum impacto funcional. O listener é código morto que estará pronto quando o backend implementar rate limiting.

### Correção

Nenhuma ação necessária. Manter listener para futura implementação ou remover para limpeza.

---

## BUG 6 — `rpg_action` echo: Backend broadcast ignorado pelo frontend

**Severidade: BAIXA (legacy/não utilizado)**

### O que é

O backend recebe `rpg_action` e faz broadcast para a sala. O frontend não tem listener para receber o broadcast.

### Backend

**Arquivo**: `Backend/websocket/handlers/rpgActionHandler.js:1-71`

```javascript
// Valida, constrói payload, persiste na sessão, e:
sm.sendToRoom(roomId, 'rpg_action', {
  id: Date.now(), userId, username, action, target, description, roomId, timestamp: Date.now()
});
```

**Status na documentação**: `"supported_non_primary"` — fora do caminho principal.

### Frontend

**Emissão existe**: `send.js:7-12` → `playerAction(actionData)` emite `rpg_action`

**Listener**: ❌ Inexistente — `rpg_action` não está em `internalEvents` em `listeners.js`

**Uso real**: `playerAction()` **nunca é chamada** por nenhum componente. O caminho principal usa `mensagem_para_mestre` e `mensagem_roleplay`.

### Impacto

Nenhum. Feature legacy não utilizada no flow atual.

### Correção

Considerar remoção de `rpgActionHandler.js` e `playerAction()` para limpeza. Ou manter para extensibilidade futura.

---

## BUG 7 — `status_update` echo: Mesmo padrão do rpg_action

**Severidade: BAIXA (legacy/não utilizado)**

### Backend

**Arquivo**: `Backend/websocket/handlers/statusUpdateHandler.js:1-65`

```javascript
sm.sendToRoom(roomId, 'status_update', {
  userId, username, status, details, roomId, timestamp: Date.now()
});
```

**Status na documentação**: `"canonical"` — oficialmente suportado.

### Frontend

**Emissão existe**: `send.js:21-26` → `updateStatus(statusData)` emite `status_update`

**Listener**: ❌ Inexistente

**Uso real**: `updateStatus()` **nunca é chamada** por nenhum componente.

### Impacto

Nenhum. Feature documentada como canonical mas não integrada no frontend.

---

## BUG 8 — `combate_resultado_acao` tipo `status_efeito`: Ação bloqueada sem feedback visual

**Severidade: BAIXA**

### O que é

Quando um jogador está paralisado/atordoado/congelado, o backend emite `combate_resultado_acao` com `tipo: 'status_efeito'`. O frontend não processa este subtipo para feedback visual.

### Backend

**Arquivo**: `Backend/websocket/engines/combatEngine.js:203-207`

```javascript
{
  tipo: 'status_efeito',
  personagem: se.personagem,
  userId: se.userId,
  status: se.efeito,            // 'paralisado' | 'atordoado' | 'congelado'
  mensagem: `${se.personagem} está ${se.efeito} e não pode agir!`,
  timestamp: Date.now()
}
```

**Não emite `combate_jogador_ferido`** como fallback (HP não muda).

### Frontend

- `listeners.js:582-611`: Sem branch para `status_efeito`
- `normalizeResultadoAcao()`: Tenta extrair `alvo.userId` de undefined → retorna null
- `BatalhaUI LogEntry`: ✅ Renderiza corretamente no log compacto com `💫`

### Impacto

Informação aparece no log de combate mas sem destaque visual no painel do jogador. Jogador pode não entender por que sua ação não foi executada.

---

## Matriz Completa de Compatibilidade

### Eventos 100% Compatíveis (40)

| Categoria | Eventos |
|-----------|---------|
| **Autenticação** | `authenticated`, `force_disconnect`, `error` |
| **Sala** | `room_joined`, `room_left`, `user_joined`, `user_left` |
| **Mensagens** | `chat_message`, `mensagem_mestre`, `mensagem_roleplay` |
| **Turnos** | `turno_alterado`, `turno_iniciado`, `turno_estado_atualizado`, `mestre_finalizou_turno`, `rodada_finalizada`, `nova_rodada_iniciada` |
| **Dados** | `dice_roll`, `resultado_teste`, `teste_rejeitado`, `resultado_dado_inicial`, `ordem_definida`, `mestre_solicita_dados` |
| **Combate** | `combate_iniciado`, `combate_resultado_acao` (ataque_jogador, ataque_monstro), `combate_monstro_derrotado`, `combate_jogador_ferido`, `combate_estado`, `combate_finalizado`, `combate_loot` |
| **Sessão** | `aventura_iniciada`, `fase_atualizada`, `sessao_resetada`, `sessao_encerrada` |
| **Progressão** | `level_up` |
| **Erros** | `erro_turno`, `erro_mensagem`, `erro_cooldown_roleplay`, `erro_dado_inicial`, `erro_sistema`, `server_message` |

### Eventos com Incompatibilidade (8)

| Evento | Tipo | Bug # |
|--------|------|-------|
| `status_jogo_alterado` | Backend emite → Frontend ignora | 1 |
| `combate_resultado_acao` (status_dano) | Subtipo não tratado para HP | 2 |
| `acao_mestre` (27 subtipos) | Sem state update | 3 |
| `join_room_error` | Listener órfão | 4 |
| `leave_room_error` | Listener órfão | 4 |
| `authentication_error` | Listener órfão | 4 |
| `rate_limit_exceeded` | Listener sem emissão | 5 |
| `rpg_action` broadcast | Sem listener | 6 |
| `status_update` broadcast | Sem listener | 7 |
| `combate_resultado_acao` (status_efeito) | Sem branch visual | 8 |

---

## Priorização de Correções

### P0 — Corrigir agora (afeta gameplay)

1. **BUG 2**: Adicionar handler para `status_dano` em `listeners.js` (atualizar HP)
2. **BUG 3 parcial**: Adicionar state update para `dano_ambiental` e `personagem_estabilizado` (HP)
3. **BUG 3 parcial**: Adicionar state update para `efeitos_expirados` (limpar status_efeitos)

### P1 — Corrigir em breve (UX degradada)

4. **BUG 1**: Adicionar listener `status_jogo_alterado` + emitir no `/jogo/start`
5. **BUG 3 parcial**: State update para `item_recebido`/`item_removido`/`equipamento_danificado`
6. **BUG 8**: Branch para `status_efeito` com feedback visual

### P2 — Limpeza técnica

7. **BUG 4**: Remover listeners órfãos (join_room_error, leave_room_error, authentication_error)
8. **BUG 5**: Manter `rate_limit_exceeded` (pronto para implementação futura)
9. **BUG 6/7**: Avaliar remoção de `rpg_action`/`status_update` handlers ou integração

---

## Arquivos a Modificar

| Arquivo | Bugs | Tipo de mudança |
|---------|------|-----------------|
| `Frontend/src/store/socket/listeners.js` | 1,2,3,4,5,8 | Adicionar listeners + branches |
| `Frontend/src/store/socket/dtos.js` | 2 | Normalizer para status_dano/status_efeito |
| `Frontend/src/store/socket/rooms.js` | 4 | Remover listeners órfãos |
| `Frontend/src/store/socket/connection.js` | 4 | Remover listener órfão |
| `Frontend/src/components/Jogo/Etapas/EtapaSalaEspera.jsx` | 1 | Handler para status_jogo_alterado |
| `Backend/routes/jogo.js` | 1 | Emitir status_jogo_alterado no /start |
| `Backend/websocket/gateways/roomGateway.js` | 1 | Incluir statusJogo em room_joined |
