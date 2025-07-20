# 🔌 Arquitetura WebSocket - Frontend

Implementação completa da arquitetura WebSocket para o RPG Chat Game no frontend React.

## 📁 Estrutura Implementada

```
src/
├── 📂 services/
│   └── WebSocketService.js          # Serviço principal WebSocket
├── 📂 hooks/
│   └── useWebSocket.js              # Hook React para WebSocket
├── 📂 components/
│   └── WebSocketStatus.jsx         # Componentes de status
├── 📂 utils/
│   └── EventEmitter.js              # EventEmitter personalizado
└── 📂 views/Jogo/
    └── index.jsx                    # Implementação no jogo
```

## 🚀 Funcionalidades Implementadas

### ✅ WebSocketService
- **Conexão automática** com reconexão inteligente
- **Autenticação JWT** integrada
- **Gerenciamento de salas** e sessões
- **Chat em tempo real** com diferentes tipos de mensagem
- **Ações de jogador** (rolar dados, habilidades, etc.)
- **Rate limiting** automático
- **Event system** robusto

### ✅ Hook useWebSocket
- **Estado reativo** para React
- **Callbacks personalizados** para eventos
- **Cleanup automático** de listeners
- **Gerenciamento de estado** centralizado

### ✅ Componentes de UI
- **WebSocketStatus**: Indicador visual de conexão
- **WebSocketStatusCompact**: Versão minimalista
- **Chat integrado** com mensagens em tempo real

## 🎯 Integração na JogoView

### Fluxo Completo
1. **Seleção de Personagem** → Carrega personagens da história
2. **Iniciar Sessão** → Conecta WebSocket + Autentica + Entra na sala
3. **Jogo Ativo** → Chat + Ações + Status em tempo real

### Eventos Suportados
```javascript
// Conexão e Autenticação
webSocket.connect(authData)
webSocket.authenticate({ userId, username, personagemId })

// Salas e Sessões  
webSocket.joinRoom(roomId, sessionId)
webSocket.startSession({ historiaId, personagemId, roomId })

// Chat
webSocket.sendMessage({ message, messageType: 'chat' })
webSocket.startTyping() / webSocket.stopTyping()

// Ações de Jogador
webSocket.playerAction({ 
  action: 'roll_dice', 
  actionData: { dice: '1d20', reason: 'Teste' }
})
```

## 🔧 Configuração

### Variáveis de Ambiente
```bash
# .env
REACT_APP_WEBSOCKET_URL=ws://localhost:3001
REACT_APP_API_URL=http://localhost:3001
```

### Inicialização
```javascript
import { useWebSocket } from '../hooks/useWebSocket.js';

const webSocket = useWebSocket({
  autoConnect: false,
  onConnect: () => console.log('Conectado!'),
  onMessage: (msg) => console.log('Nova mensagem:', msg)
});
```

## 📡 Eventos WebSocket

### 🔗 Recebidos do Servidor
```javascript
// Conexão
'connected' - Conectado com sucesso
'disconnected' - Desconectado do servidor
'authenticated' - Autenticação confirmada

// Salas
'room_joined' - Entrou na sala
'user_joined' - Novo usuário na sala
'user_left' - Usuário saiu da sala

// Sessões
'session_started' - Sessão de jogo iniciada
'session_ended' - Sessão finalizada

// Chat
'new_message' - Nova mensagem no chat
'user_typing' - Usuário digitando
'private_message' - Mensagem privada

// Ações
'action_result' - Resultado de ação de jogador
'player_action' - Ação de outro jogador
```

### 📤 Enviados para o Servidor
```javascript
// Autenticação
'authenticate' - Autenticar usuário
'join_room' - Entrar em sala
'start_session' - Iniciar sessão

// Chat
'send_message' - Enviar mensagem
'typing_start' - Começar a digitar
'typing_stop' - Parar de digitar

// Ações
'player_action' - Executar ação de jogador
'ping' - Verificar conexão
```

## 🎮 Uso na Prática

### Iniciar Sessão de Jogo
```javascript
const iniciarSessao = async () => {
  // 1. Conectar
  await webSocket.connect();
  
  // 2. Autenticar
  await webSocket.authenticate({
    userId: user.id,
    username: user.name,
    personagemId: personagem.id
  });
  
  // 3. Entrar na sala
  await webSocket.joinRoom(`historia_${historiaId}`);
  
  // 4. Iniciar sessão
  await webSocket.startSession({
    historiaId,
    personagemId: personagem.id,
    roomId: `historia_${historiaId}`
  });
};
```

### Chat em Tempo Real
```javascript
// Enviar mensagem
webSocket.sendMessage({
  message: 'Olá pessoal!',
  messageType: 'chat'
});

// Diferentes tipos de mensagem
webSocket.sendMessage({
  message: 'Eu ataco o orc!',
  messageType: 'ic' // In Character
});

// Rolar dados via chat
webSocket.sendMessage({
  message: '/roll 1d20+5 Teste de Força',
  messageType: 'dice'
});
```

### Ações de Jogador
```javascript
// Rolar dados
webSocket.playerAction({
  action: 'roll_dice',
  actionData: {
    dice: '2d6+3',
    reason: 'Ataque com espada'
  }
});

// Usar habilidade
webSocket.playerAction({
  action: 'use_skill',
  actionData: {
    skillId: 'fireball',
    target: 'orc_1',
    parameters: { level: 3 }
  }
});
```

## 🛡️ Tratamento de Erros

### Reconexão Automática
- **5 tentativas** com backoff exponencial
- **Delay máximo** de 30 segundos
- **Estado preservado** durante reconexão

### Rate Limiting
- **Mensagens**: 30/minuto
- **Ações**: 60/minuto
- **Feedback visual** quando excedido

### Validações
- **Conexão obrigatória** para enviar dados
- **Autenticação obrigatória** para ações
- **Estados consistentes** em toda aplicação

## 🎨 Interface de Status

### Indicadores Visuais
- 🔴 **Vermelho**: Erro ou desconectado
- 🟡 **Amarelo**: Conectando ou não autenticado  
- 🟢 **Verde**: Conectado e pronto
- 🔵 **Azul**: Em sala ou sessão ativa

### Informações Exibidas
- **Status da conexão**
- **Usuário atual**
- **Sala/Sessão ativa**
- **Botão de reconexão** (quando necessário)

## 🔄 Ciclo de Vida

1. **Componente monta** → Hook inicializa
2. **Usuário inicia sessão** → Conecta WebSocket
3. **Autenticação** → Valida usuário
4. **Entra na sala** → Recebe outros participantes
5. **Sessão ativa** → Chat + Ações funcionais
6. **Componente desmonta** → Desconecta automaticamente

Esta arquitetura fornece uma base sólida e escalável para jogos RPG online em tempo real! 🎲✨ 