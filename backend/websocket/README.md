# 🎮 WebSocket Server - RPG Chat Game

Estrutura completa e organizada do servidor WebSocket para o RPG Chat Game, com eventos de conexão, emitters, listeners e a melhor arquitetura para gerenciamento de funcionalidades.

## 📁 Estrutura de Pastas

```
websocket/
├── 📂 server/                    # Servidor principal
│   └── WebSocketServer.js        # Classe principal do servidor
├── 📂 handlers/                  # Manipuladores de eventos
│   ├── index.js                  # Registry central de handlers
│   ├── connectionHandlers.js     # Eventos de conexão/autenticação
│   ├── gameHandlers.js          # Eventos de jogo/sessões RPG
│   ├── chatHandlers.js          # Eventos de chat/mensagens
│   └── systemHandlers.js        # Eventos de sistema
├── 📂 events/                   # Sistema de eventos
│   ├── EventEmitter.js          # Event emitter customizado
│   └── eventTypes.js            # Tipos de eventos definidos
├── 📂 middleware/               # Middlewares
│   ├── authMiddleware.js        # Autenticação JWT
│   └── rateLimitMiddleware.js   # Rate limiting por evento
├── 📂 utils/                    # Utilitários
└── index.js                    # Ponto de entrada principal
```

## 🚀 Inicialização

```javascript
import { initializeWebSocket } from './websocket/index.js';
import { createServer } from 'http';
import express from 'express';

const app = express();
const httpServer = createServer(app);

// Inicializar WebSocket
const webSocketServer = initializeWebSocket(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
});

httpServer.listen(3001, () => {
  console.log('🚀 Servidor rodando na porta 3001');
});
```

## 📡 Eventos Disponíveis

### 🔗 Conexão e Autenticação

#### Cliente → Servidor:
- `authenticate` - Autenticar usuário
- `join_room` - Entrar em uma sala
- `leave_room` - Sair de uma sala
- `ping` - Verificar conexão
- `get_status` - Obter status do usuário

#### Servidor → Cliente:
- `welcome` - Mensagem de boas-vindas
- `authenticated` - Confirmação de autenticação
- `room_joined` - Confirmação de entrada na sala
- `room_left` - Confirmação de saída da sala
- `user_joined` - Novo usuário na sala
- `user_left` - Usuário saiu da sala
- `pong` - Resposta ao ping

### 🎮 Jogo e Sessões

#### Cliente → Servidor:
- `start_session` - Iniciar sessão de RPG
- `end_session` - Finalizar sessão
- `player_action` - Ação de jogador

#### Servidor → Cliente:
- `session_started` - Sessão iniciada
- `session_ended` - Sessão finalizada
- `player_action` - Ação processada
- `action_result` - Resultado da ação

### 💬 Chat e Mensagens

#### Cliente → Servidor:
- `send_message` - Enviar mensagem
- `typing_start` - Começar a digitar
- `typing_stop` - Parar de digitar
- `get_message_history` - Obter histórico

#### Servidor → Cliente:
- `new_message` - Nova mensagem
- `private_message` - Mensagem privada
- `user_typing` - Usuário digitando
- `message_history` - Histórico de mensagens

## 🎯 Tipos de Ações de Jogador

```javascript
// Rolagem de dados
socket.emit('player_action', {
  sessionId: 'sessao_123',
  action: 'roll_dice',
  actionData: {
    dice: '2d6+3',
    modifier: 2,
    reason: 'Teste de Força'
  }
});

// Usar habilidade
socket.emit('player_action', {
  sessionId: 'sessao_123',
  action: 'use_skill',
  actionData: {
    skillId: 'fireball',
    target: 'orc_1',
    parameters: { level: 3 }
  }
});

// Ataque
socket.emit('player_action', {
  sessionId: 'sessao_123',
  action: 'attack',
  actionData: {
    target: 'goblin_1',
    weapon: 'sword',
    attackType: 'melee'
  }
});
```

## 💬 Tipos de Mensagens de Chat

```javascript
// Chat normal
socket.emit('send_message', {
  roomId: 'sala_123',
  message: 'Olá pessoal!',
  messageType: 'chat'
});

// Mensagem In Character (IC)
socket.emit('send_message', {
  roomId: 'sala_123',
  message: 'Eu ataco o orc!',
  messageType: 'ic'
});

// Mensagem Out of Character (OOC)
socket.emit('send_message', {
  roomId: 'sala_123',
  message: 'Preciso sair por uns minutos',
  messageType: 'ooc'
});

// Ação/Emote
socket.emit('send_message', {
  roomId: 'sala_123',
  message: 'se esconde atrás da árvore',
  messageType: 'action'
});

// Rolagem de dados no chat
socket.emit('send_message', {
  roomId: 'sala_123',
  message: '/roll 1d20+5 Teste de Percepção',
  messageType: 'dice'
});

// Mensagem privada
socket.emit('send_message', {
  roomId: 'sala_123',
  message: 'Mensagem secreta',
  messageType: 'whisper',
  isPrivate: true,
  targetUser: 'jogador_2'
});
```

## 🔐 Autenticação

```javascript
// Conectar com token
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'seu_jwt_token_aqui'
  }
});

// Ou autenticar depois da conexão
socket.emit('authenticate', {
  userId: '123',
  username: 'jogador1',
  token: 'seu_jwt_token_aqui'
});
```

## 🚫 Rate Limiting

O sistema inclui rate limiting automático:

- **Mensagens**: 30 por minuto
- **Ações de jogador**: 60 por minuto
- **Entrada em salas**: 10 por minuto
- **Digitação**: 120 eventos por minuto
- **Ping**: 60 por minuto

Quando excedido, o cliente recebe:
```javascript
socket.on('rate_limit_exceeded', (data) => {
  console.log(`Rate limit excedido: ${data.message}`);
  console.log(`Tente novamente em: ${data.remainingMs}ms`);
});
```

## 📊 Estatísticas e Monitoramento

```javascript
// Obter estatísticas (apenas admins)
socket.on('server_stats_detailed', (stats) => {
  console.log('Conexões atuais:', stats.connections.current);
  console.log('Sessões ativas:', stats.sessions.total);
  console.log('Rate limiting:', stats.rateLimit);
});
```

## 🛠️ Middleware Customizado

### Autenticação
```javascript
import { authMiddleware } from './websocket/index.js';

// Gerar token
const token = authMiddleware.generateToken('123', 'jogador1', 'player');

// Verificar autenticação em handlers
if (!authMiddleware.requireAuth(socket)) {
  return; // Usuário não autenticado
}
```

### Rate Limiting
```javascript
import { rateLimitMiddleware } from './websocket/index.js';

// Configurar limite customizado
rateLimitMiddleware.setEventLimit('custom_event', {
  maxRequests: 50,
  windowMs: 60000,
  blockDurationMs: 300000
});
```

## 🎯 Event Emitter Global

```javascript
import { EventEmitter, EVENT_TYPES } from './websocket/index.js';

const eventEmitter = EventEmitter.getInstance();

// Escutar eventos globais
eventEmitter.on(EVENT_TYPES.SESSION.STARTED, (data) => {
  console.log(`Nova sessão iniciada: ${data.sessionId}`);
});

// Emitir eventos customizados
eventEmitter.emit(EVENT_TYPES.CUSTOM.MY_EVENT, {
  data: 'algum dado'
});
```

## 🔧 Configuração Avançada

```javascript
const webSocketServer = initializeWebSocket(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://meudominio.com"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Acessar instância do Socket.IO
const io = webSocketServer.getIO();

// Acessar handlers
const handlers = webSocketServer.getHandlers();

// Broadcast customizado
webSocketServer.broadcast('custom_event', { data: 'test' });
webSocketServer.broadcastToRoom('sala_123', 'room_event', { data: 'test' });
```

## 🧪 Teste de Conexão

Arquivo HTML para teste:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Teste WebSocket RPG</title>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
    <script>
        const socket = io();
        
        socket.on('welcome', (data) => {
            console.log('Conectado:', data);
        });
        
        // Autenticar
        socket.emit('authenticate', {
            userId: '123',
            username: 'TestUser'
        });
        
        // Entrar em sala
        socket.emit('join_room', {
            roomId: 'test_room',
            sessionId: 'test_session'
        });
        
        // Enviar mensagem
        socket.emit('send_message', {
            roomId: 'test_room',
            message: 'Olá mundo!',
            messageType: 'chat'
        });
    </script>
</body>
</html>
```

## 🏗️ Arquitetura

- **Modular**: Cada tipo de evento tem seu próprio handler
- **Escalável**: Fácil adicionar novos eventos e funcionalidades  
- **Seguro**: Autenticação JWT + Rate limiting
- **Monitorado**: Estatísticas em tempo real
- **Flexível**: Middlewares customizáveis
- **Robusto**: Tratamento de erros em todas as camadas

Esta estrutura fornece uma base sólida e extensível para um sistema de WebSocket completo para RPG online! 🎮✨ 