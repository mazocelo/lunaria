# WebSocket - Role Chat Game

Documentação completa do sistema WebSocket para comunicação em tempo real.

## Visão Geral

O WebSocket é usado para comunicação em tempo real entre jogadores durante sessões de RPG. Ele permite:

- Chat em tempo real
- Ações de RPG
- Rolagem de dados
- Atualizações de status
- Gerenciamento de salas

## Conexão

### Conectar ao WebSocket

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling']
});
```

## Eventos do Cliente

### Autenticação

```javascript
// Autenticar usuário
socket.emit('authenticate', {
  userId: 'user123',
  username: 'Jogador1',
  sessionId: 'session456'
});

// Resposta de autenticação
socket.on('authenticated', (data) => {
  console.log('Autenticado:', data);
  // data: { userId, username, socketId }
});
```

### Gerenciamento de Salas

```javascript
// Entrar em uma sala
socket.emit('join_room', {
  roomId: 'sala_123',
  userId: 'user123',
  username: 'Jogador1'
});

// Sair de uma sala
socket.emit('leave_room', {
  roomId: 'sala_123',
  userId: 'user123',
  username: 'Jogador1'
});

// Eventos de sala
socket.on('user_joined', (data) => {
  console.log(`${data.username} entrou na sala`);
});

socket.on('user_left', (data) => {
  console.log(`${data.username} saiu da sala`);
});

socket.on('room_users', (data) => {
  console.log('Usuários na sala:', data.users);
});
```

### Chat

```javascript
// Enviar mensagem
socket.emit('chat_message', {
  roomId: 'sala_123',
  userId: 'user123',
  username: 'Jogador1',
  message: 'Olá, pessoal!',
  type: 'chat' // ou 'system', 'gm', etc.
});

// Receber mensagem
socket.on('chat_message', (data) => {
  console.log(`${data.username}: ${data.message}`);
  // data: { id, userId, username, message, type, roomId, timestamp }
});
```

### Ações RPG

```javascript
// Enviar ação RPG
socket.emit('rpg_action', {
  roomId: 'sala_123',
  userId: 'user123',
  username: 'Jogador1',
  action: 'attack',
  target: 'goblin',
  description: 'Ataco o goblin com minha espada'
});

// Receber ação RPG
socket.on('rpg_action', (data) => {
  console.log(`${data.username} executou: ${data.action}`);
  // data: { id, userId, username, action, target, description, roomId, timestamp }
});
```

### Rolagem de Dados

```javascript
// Enviar rolagem
socket.emit('dice_roll', {
  roomId: 'sala_123',
  userId: 'user123',
  username: 'Jogador1',
  dice: '1d20',
  result: 15,
  description: 'Teste de ataque'
});

// Receber rolagem
socket.on('dice_roll', (data) => {
  console.log(`${data.username} rolou ${data.dice}: ${data.result}`);
  // data: { id, userId, username, dice, result, description, roomId, timestamp }
});
```

### Atualização de Status

```javascript
// Atualizar status
socket.emit('status_update', {
  roomId: 'sala_123',
  userId: 'user123',
  username: 'Jogador1',
  status: 'ready',
  details: { hp: 20, mp: 15 }
});

// Receber atualização de status
socket.on('status_update', (data) => {
  console.log(`${data.username} atualizou status: ${data.status}`);
  // data: { userId, username, status, details, roomId, timestamp }
});
```

### Manutenção de Conexão

```javascript
// Ping para manter conexão
socket.emit('ping');

// Receber pong
socket.on('pong', (data) => {
  console.log('Pong recebido:', data.timestamp);
});
```

### Tratamento de Erros

```javascript
socket.on('error', (data) => {
  console.error('Erro do WebSocket:', data.message);
});
```

### Desconexão

```javascript
socket.on('disconnect', (reason) => {
  console.log('Desconectado:', reason);
});
```

## Eventos do Servidor

### Broadcast para Todos

```javascript
// Enviar para todos os clientes conectados
socketManager.io.emit('event_name', data);
```

### Enviar para Sala Específica

```javascript
// Enviar para uma sala específica
socketManager.sendToRoom('sala_123', 'event_name', data);
```

### Enviar para Usuário Específico

```javascript
// Enviar para um usuário específico
socketManager.sendToUser('user123', 'event_name', data);
```

## APIs REST para WebSocket

### Estatísticas

```bash
GET /websocket/stats
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "connectedUsers": 5,
    "activeRooms": 2,
    "totalRooms": 3
  }
}
```

### Broadcast

```bash
POST /websocket/broadcast
Content-Type: application/json

{
  "event": "announcement",
  "data": {
    "message": "Manutenção programada em 10 minutos"
  }
}
```

### Mensagem para Sala

```bash
POST /websocket/room/sala_123/message
Content-Type: application/json

{
  "event": "gm_message",
  "data": {
    "message": "Um dragão aparece no horizonte!",
    "type": "narrative"
  }
}
```

### Mensagem para Usuário

```bash
POST /websocket/user/user123/message
Content-Type: application/json

{
  "event": "private_message",
  "data": {
    "message": "Você encontrou um item raro!",
    "item": "Espada Lendária"
  }
}
```

## Estrutura de Dados

### Sala (Room)

```javascript
{
  roomId: 'sala_123',
  users: Set(['user1', 'user2', 'user3']),
  messages: [], // Últimas 100 mensagens
  actions: [], // Ações RPG
  rolls: []    // Rolagens
}
```

### Usuário (User)

```javascript
{
  userId: 'user123',
  username: 'Jogador1',
  socketId: 'socket_456',
  sessionId: 'session_789',
  connectedAt: 1640995200000,
  rooms: Set(['sala_123'])
}
```

### Mensagem

```javascript
{
  id: 'msg_123',
  userId: 'user123',
  username: 'Jogador1',
  message: 'Olá, pessoal!',
  type: 'chat', // chat, system, gm, narrative
  roomId: 'sala_123',
  timestamp: 1640995200000
}
```

### Ação RPG

```javascript
{
  id: 'action_123',
  userId: 'user123',
  username: 'Jogador1',
  action: 'attack',
  target: 'goblin',
  description: 'Ataco o goblin com minha espada',
  roomId: 'sala_123',
  timestamp: 1640995200000
}
```

### Rolagem

```javascript
{
  id: 'roll_123',
  userId: 'user123',
  username: 'Jogador1',
  dice: '1d20',
  result: 15,
  description: 'Teste de ataque',
  roomId: 'sala_123',
  timestamp: 1640995200000
}
```

## Redis

O WebSocket usa Redis para persistir dados em tempo real:

### Chaves Redis

- `user:{userId}` - Informações do usuário
- `room:{roomId}:users` - Usuários na sala
- `room:{roomId}:user:{userId}` - Dados do usuário na sala
- `room:{roomId}:messages` - Mensagens da sala
- `room:{roomId}:actions` - Ações RPG da sala
- `room:{roomId}:rolls` - Rolagens da sala

## Segurança

### CORS

```javascript
cors: {
  origin: "*", // Em produção, especificar domínios permitidos
  methods: ["GET", "POST"]
}
```

### Validação

- Todos os eventos são validados antes do processamento
- IDs de usuário e sala são obrigatórios
- Dados são sanitizados antes de salvar

### Rate Limiting

- Implementar rate limiting por usuário
- Limitar número de mensagens por minuto
- Proteger contra spam

## Monitoramento

### Logs

- Conexões e desconexões
- Eventos de sala
- Mensagens de chat
- Ações RPG
- Erros e exceções

### Métricas

- Usuários conectados
- Salas ativas
- Mensagens por minuto
- Latência média

## Exemplo de Implementação Cliente

```javascript
class RPGWebSocket {
  constructor(url) {
    this.socket = io(url);
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('Conectado ao WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado do WebSocket');
    });

    this.socket.on('error', (error) => {
      console.error('Erro do WebSocket:', error);
    });
  }

  authenticate(userId, username, sessionId) {
    this.socket.emit('authenticate', { userId, username, sessionId });
  }

  joinRoom(roomId, userId, username) {
    this.socket.emit('join_room', { roomId, userId, username });
  }

  sendMessage(roomId, userId, username, message, type = 'chat') {
    this.socket.emit('chat_message', {
      roomId, userId, username, message, type
    });
  }

  sendAction(roomId, userId, username, action, target, description) {
    this.socket.emit('rpg_action', {
      roomId, userId, username, action, target, description
    });
  }

  sendDiceRoll(roomId, userId, username, dice, result, description) {
    this.socket.emit('dice_roll', {
      roomId, userId, username, dice, result, description
    });
  }

  onMessage(callback) {
    this.socket.on('chat_message', callback);
  }

  onAction(callback) {
    this.socket.on('rpg_action', callback);
  }

  onDiceRoll(callback) {
    this.socket.on('dice_roll', callback);
  }

  onUserJoined(callback) {
    this.socket.on('user_joined', callback);
  }

  onUserLeft(callback) {
    this.socket.on('user_left', callback);
  }
}

// Uso
const rpgSocket = new RPGWebSocket('http://localhost:3001');
rpgSocket.authenticate('user123', 'Jogador1', 'session456');
rpgSocket.joinRoom('sala_123', 'user123', 'Jogador1');

rpgSocket.onMessage((data) => {
  console.log(`${data.username}: ${data.message}`);
});

rpgSocket.sendMessage('sala_123', 'user123', 'Jogador1', 'Olá, pessoal!');
```

## Troubleshooting

### Problemas Comuns

1. **Conexão falha**
   - Verificar se o servidor está rodando
   - Verificar configurações de CORS
   - Verificar firewall

2. **Mensagens não chegam**
   - Verificar se está na sala correta
   - Verificar autenticação
   - Verificar logs do servidor

3. **Redis não conecta**
   - Verificar se Redis está rodando
   - Verificar URL do Redis
   - WebSocket funciona sem Redis

4. **Performance**
   - Monitorar número de conexões
   - Verificar uso de memória
   - Implementar rate limiting

### Logs Úteis

```bash
# Verificar conexões WebSocket
GET /websocket/stats

# Verificar logs do servidor
npm run dev
``` 