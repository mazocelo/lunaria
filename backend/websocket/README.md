# WebSocket Contract - Role Chat Game

Este documento descreve o contrato publico real do websocket usado hoje pelo runtime em `Backend/websocket/socketManager.js`.

O documento antigo descrevia uma arquitetura modular que nao existe mais no fluxo principal e citava eventos que nao sao emitidos pelo backend atual, como `send_message`, `player_action`, `start_session`, `welcome` e `pong`.

O catalogo estruturado deste contrato fica em `Backend/websocket-events-documentation.json`.

## Escopo

Este contrato cobre:

- eventos que o cliente realmente pode emitir para o `socketManager`
- eventos que o backend realmente emite para o frontend atual
- campos canonicos vs campos de compatibilidade temporaria
- diferenca entre snapshot persistido e evento live

## Principios do contrato

1. O cliente precisa emitir `authenticate` depois de conectar. O handshake do Socket.IO pode carregar `auth`, mas o runtime atual so considera o socket autenticado depois do evento `authenticate`.
2. `room_joined` entrega o snapshot inicial da sessao e do historico persistido.
3. `turno_estado_atualizado` e o evento autoritativo para estado live de turno e testes pendentes.
4. Para mensagens, `message` e o campo canonico de texto. `mensagem` continua existindo em varios payloads como espelho de compatibilidade.
5. Em snapshots de sessao, `estadoJogo.turno` e o formato canonico. `turnoIniciado`, `dadosSolicitados`, `testeInfo` e `testePendente` ainda podem aparecer como aliases temporarios.

## Fluxo recomendado

1. Conectar via Socket.IO.
2. Emitir `authenticate`.
3. Esperar `authenticated`.
4. Emitir `join_room`.
5. Hidratar a UI com `room_joined.sessao`.
6. A partir dai, atualizar a interface com eventos live, principalmente `turno_estado_atualizado`, `mestre_solicita_dados`, `resultado_teste`, `mensagem_mestre`, `acao_mestre` e eventos de combate.

## Cliente -> Servidor

| Evento | Uso | Campos obrigatorios | Campos opcionais |
| --- | --- | --- | --- |
| `authenticate` | Finaliza autenticacao do socket | `userId`, `username` | `sessionId`, `email`, `token` |
| `join_room` | Entrar em uma sala, normalmente `historia_<id>` | `roomId`, `userId` | `username`, `historiaId`, `historiaData`, `personagemId`, `personagemNome`, `sessionId` |
| `leave_room` | Sair da sala atual | `roomId`, `userId` | `username` |
| `chat_message` | Chat direto nao narrado pela IA | `roomId`, `userId`, `message` | `username`, `type` |
| `mensagem_para_mestre` | Acao principal do jogador no turno | `roomId`, `userId`, `mensagem`, `personagem` | `username` |
| `mensagem_roleplay` | Fala lateral fora do turno | `roomId`, `userId`, `mensagem` | `username` |
| `rpg_action` | Acao leve estruturada, sem passar pela IA | `roomId`, `userId`, `action` | `username`, `target`, `description` |
| `dice_roll` | Publicar uma rolagem | `roomId`, `userId`, `dice`, `result` | `username`, `description` |
| `rolar_dado_inicial` | Rolagem de iniciativa d20 | `roomId`, `userId` | `username` |
| `iniciar_turno` | Pedir abertura do turno ao mestre | `roomId`, `userId` | `username` |
| `solicitar_dados` | Solicitar teste manualmente via mestre/admin | `roomId`, `motivo` | `tipoTeste`, `dificuldade`, `jogadores` |
| `status_update` | Publicar status livre do jogador | `roomId`, `userId`, `status` | `username`, `details` |

## Servidor -> Cliente

### Bootstrap e sala

- `authenticated`: confirma autenticacao e devolve `userId`, `username`, `socketId`, `sessionId`
- `force_disconnect`: encerra a conexao anterior do mesmo usuario
- `room_joined`: confirma entrada na sala e entrega o snapshot da sessao
- `room_left`: confirma saida
- `user_joined`: outro usuario entrou
- `user_left`: outro usuario saiu
- `status_jogo_alterado`: mudanca de status operacional da sessao; util para lobby e admin

### Estado do jogo e turnos

- `fase_atualizada`: troca de fase macro do jogo
- `aventura_iniciada`: inicio formal da aventura
- `resultado_dado_inicial`: resultado individual da iniciativa
- `ordem_definida`: ordem final dos jogadores
- `turno_alterado`: troca do jogador da vez
- `turno_iniciado`: confirma abertura do turno atual
- `mestre_finalizou_turno`: o mestre sinalizou fim do turno atual
- `turno_estado_atualizado`: estado autoritativo do turno e dos testes pendentes
- `mestre_solicita_dados`: pedido live de rolagem
- `teste_rejeitado`: rolagem nao corresponde ao teste ativo
- `resultado_teste`: resultado mecanico do teste resolvido
- `rodada_finalizada`: fim de rodada
- `nova_rodada_iniciada`: inicio da rodada seguinte

### Mensagens e historico live

- `chat_message`: mensagem de chat ao vivo
- `mensagem_mestre`: narrativa do mestre
- `mensagem_roleplay`: mensagem lateral de roleplay
- `acao_mestre`: efeito mecanico persistido pelo mestre
- `status_update`: broadcast de status enviado por jogador

### Sessao

- `sessao_resetada`: sessao reiniciada pelo dono da historia
- `sessao_encerrada`: sessao encerrada pelo admin com recap opcional

### Combate e progressao

- `combate_iniciado`
- `combate_resultado_acao`
- `combate_monstro_derrotado`
- `combate_jogador_ferido`
- `combate_estado`
- `combate_finalizado`
- `combate_loot`
- `level_up`

### Erros e controle

- `error`: erro generico do websocket; este e o evento base de falha no runtime atual
- `erro_mensagem`
- `erro_turno`
- `erro_dado_inicial`
- `erro_cooldown_roleplay`
- `erro_sistema`
- `rate_limit_exceeded`

## Payloads-chave

### `room_joined`

```json
{
  "roomId": "historia_123",
  "users": ["42", "77"],
  "sessao": {
    "status": "ativa",
    "historiaId": "123",
    "historiaNome": "A Fortaleza",
    "mestreConfig": {},
    "maxJogadores": 4,
    "totalJogadores": 2,
    "jogadores": {},
    "jogadoresConectados": [],
    "estadoJogo": {},
    "mensagens": []
  }
}
```

Notas:

- `sessao.estadoJogo` e o snapshot persistido.
- `sessao.mensagens` e o historico salvo ate o momento do join.
- depois do bootstrap, o cliente deve continuar sincronizando pela stream live de eventos.

### `turno_estado_atualizado`

```json
{
  "roomId": "historia_123",
  "turno": {
    "status": "awaiting_roll",
    "jogadorAtual": "42",
    "rodadaAtual": 3,
    "contadorInteracoes": 1,
    "lockReason": "teste_pendente",
    "loteTesteAtivo": "lote_abc123"
  },
  "testesPendentes": [],
  "testePendente": null,
  "timestamp": 1741872000000
}
```

`turno.status` e o estado canonico. Valores usados hoje:

- `idle`
- `starting`
- `active`
- `awaiting_roll`
- `resolving_roll`
- `finishing`

### `mestre_solicita_dados`

```json
{
  "narrativa": "O Mestre pede um teste.",
  "tipoDado": "d20",
  "teste": "Percepcao",
  "dificuldade": "Media",
  "modificador": 0,
  "atributo": "sabedoria",
  "contexto": "Ouvir passos no corredor",
  "origem": "mestre",
  "groupId": "lote_abc123",
  "testePendente": {},
  "testesPendentes": [],
  "timestamp": 1741872000000
}
```

### `resultado_teste`

```json
{
  "userId": "42",
  "username": "Marcelo",
  "personagemNome": "Arannis",
  "dice": "d20",
  "rolagemBruta": 17,
  "modificador": 3,
  "bonusNivel": 1,
  "bonusVantDesvant": 0,
  "detalhesBonus": [],
  "totalModificador": 4,
  "total": 21,
  "dc": 15,
  "dificuldadeNome": "Media",
  "sucesso": true,
  "descricaoResultado": "Sucesso!",
  "testeId": "teste_123",
  "groupId": "lote_abc123",
  "timestamp": 1741872000000
}
```

### `mensagem_mestre`, `mensagem_roleplay` e `acao_mestre`

Esses eventos usam envelope de mensagem de sessao. Campos recorrentes:

```json
{
  "id": "msg_123",
  "tipo": "mestre",
  "canal": "formal",
  "origem": "turno",
  "userId": "mestre",
  "username": "Mestre",
  "message": "Texto canonico",
  "mensagem": "Texto espelho de compatibilidade",
  "payload": {},
  "timestamp": 1741872000000
}
```

Para consumidores novos:

- use `message` como texto principal
- trate `mensagem` como alias temporario
- preserve `payload` quando existir

## Snapshot persistido vs evento live

- `room_joined.sessao.mensagens`: historico persistido para hidratar a tela ao entrar ou reconectar
- `chat_message`, `mensagem_mestre`, `mensagem_roleplay`, `resultado_dado_inicial`, `resultado_teste`, `acao_mestre`: stream live apos o bootstrap
- `turno_estado_atualizado`: estado live autoritativo; nao substitua isso por inferencia local

## Compatibilidade temporaria

Os campos abaixo ainda podem aparecer por compatibilidade, mas nao devem ser a base de novos clientes:

- `sessao.estadoJogo.turnoIniciado`: alias legado de `estadoJogo.turno.status`
- `sessao.estadoJogo.dadosSolicitados`: alias booleano derivado de `testesPendentes`
- `sessao.estadoJogo.testeInfo`: resumo legado do teste ativo
- `sessao.estadoJogo.testePendente`: atalho legado para o primeiro teste pendente
- `mensagem`: alias de texto em varios eventos de mensagem

O campo canonico para texto live e persistido e `message`.

## Eventos legados ou fora do contrato atual

Estes nomes nao devem aparecer em novos clientes:

- `send_message`
- `new_message`
- `player_action`
- `action_result`
- `start_session`
- `session_started`
- `session_ended`
- `typing_start`
- `typing_stop`
- `user_typing`
- `get_message_history`
- `message_history`
- `get_status`
- `status_response`
- `welcome`
- `pong`
- `room_users`
- `connection_error`
- `authentication_error`
- `join_room_error`
- `leave_room_error`
- `start_session_error`

Alguns ainda existem em codigo legado do frontend, mas nao fazem parte do runtime publico do `socketManager`.

## Exemplos atuais

### Conectar, autenticar e entrar na sessao

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001', {
  transports: ['websocket', 'polling'],
  autoConnect: false
});

socket.connect();

socket.emit('authenticate', {
  userId: '42',
  username: 'Marcelo',
  sessionId: Date.now().toString()
});

socket.on('authenticated', () => {
  socket.emit('join_room', {
    roomId: 'historia_123',
    userId: '42',
    username: 'Marcelo',
    historiaId: '123',
    personagemId: '987',
    personagemNome: 'Arannis',
    sessionId: Date.now().toString()
  });
});
```

### Enviar acao para o mestre

```javascript
socket.emit('mensagem_para_mestre', {
  roomId: 'historia_123',
  userId: '42',
  username: 'Marcelo',
  mensagem: 'Investigo o corredor com cuidado.',
  personagem: {
    nome: 'Arannis',
    classe: 'Ladino',
    nivel: 4
  }
});
```

### Responder a um teste pedido pelo mestre

```javascript
socket.on('mestre_solicita_dados', (data) => {
  socket.emit('dice_roll', {
    roomId: 'historia_123',
    userId: '42',
    username: 'Marcelo',
    dice: data.tipoDado || 'd20',
    result: '17',
    description: data.testePendente?.teste || data.teste || ''
  });
});
```
