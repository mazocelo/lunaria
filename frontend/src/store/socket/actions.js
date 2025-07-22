/**
 * 🌐 SOCKET ACTIONS - Lógicas e ações da conexão WebSocket
 * 
 * Contém todas as funções que modificam o estado do socket:
 * - Controle de conexão
 * - Gerenciamento de autenticação
 * - Manipulação de room (conexão técnica)
 * - Controle de rate limiting
 * - Gerenciamento de errors de conexão
 * - Controle de typing
 * - Funções utilitárias
 */

export const createSocketActions = (set, get) => ({
  // ===== ACTIONS - CONEXÃO =====
  setConnecting: (connecting) => {
    console.log(`🔄 SocketStore: ${connecting ? 'Iniciando' : 'Finalizando'} conexão`);
    set({ isConnecting: connecting });
    if (connecting) {
      set({ connectionAttempts: get().connectionAttempts + 1 });
    }
  },
  
  setConnected: (connected) => {
    console.log(`🔗 SocketStore: Conexão ${connected ? 'estabelecida' : 'perdida'}`);
    set({ 
      isConnected: connected,
      isConnecting: false,
      lastConnectionTime: connected ? new Date() : get().lastConnectionTime,
      connectionAttempts: connected ? 0 : get().connectionAttempts
    });
    
    if (!connected) {
      // Resetar estados dependentes da conexão
      console.log('🔄 SocketStore: Resetando estados dependentes da conexão');
      set({
        isAuthenticated: false,
        inRoom: false,
        roomUsers: [],
        isTyping: false
      });
    }
  },
  
  setReconnecting: (reconnecting) => {
    console.log(`🔄 SocketStore: ${reconnecting ? 'Iniciando' : 'Finalizando'} reconexão`);
    set({ isReconnecting: reconnecting });
  },
  
  // ===== ACTIONS - AUTENTICAÇÃO =====
  setAuthenticated: (authenticated, user = null) => {
    console.log(`🔐 SocketStore: Autenticação ${authenticated ? 'bem-sucedida' : 'perdida'}`);
    if (user) console.log('👤 SocketStore: Usuário autenticado:', user);
    
    set({ 
      isAuthenticated: authenticated,
      currentUser: authenticated ? user : null,
      userRole: authenticated && user ? user.role : null
    });
  },
  
  setCurrentUser: (user) => {
    console.log('👤 SocketStore: Usuário atual definido:', user);
    set({ currentUser: user });
  },
  
  setUserRole: (role) => {
    console.log('👑 SocketStore: Role do usuário definida:', role);
    set({ userRole: role });
  },
  
  // ===== ACTIONS - ROOM (CONEXÃO TÉCNICA) =====
  joinRoom: (roomId, users = []) => {
    console.log(`🏠 SocketStore: Entrando na room técnica ${roomId} com ${users.length} usuários conectados`);
    set({ 
      roomId,
      inRoom: true,
      roomUsers: users
    });
  },
  
  leaveRoom: () => {
    const { roomId } = get();
    console.log(`🚪 SocketStore: Saindo da room técnica ${roomId}`);
    set({
      roomId: null,
      inRoom: false,
      roomUsers: [],
      isTyping: false
    });
  },
  
  setRoomUsers: (users) => {
    console.log('👥 SocketStore: Lista de usuários conectados à room definida:', users.length);
    set({ roomUsers: users });
  },
  
  addRoomUser: (user) => {
    const { roomUsers } = get();
    if (!roomUsers.find(u => u.id === user.id)) {
      console.log('➕ SocketStore: Usuário conectado à room:', user);
      set({ roomUsers: [...roomUsers, user] });
    }
  },
  
  removeRoomUser: (userId) => {
    const { roomUsers } = get();
    console.log('➖ SocketStore: Usuário desconectado da room:', userId);
    set({ roomUsers: roomUsers.filter(u => u.id !== userId) });
  },
  
  // ===== ACTIONS - RATE LIMITING =====
  setRateLimit: (exceeded, resetTime = null) => {
    if (exceeded) {
      console.warn('⚠️ SocketStore: Rate limit excedido até:', resetTime);
    } else {
      console.log('✅ SocketStore: Rate limit liberado');
    }
    set({ 
      rateLimitExceeded: exceeded,
      rateLimitResetTime: resetTime
    });
  },
  
  updateLastMessageTime: () => {
    const now = new Date();
    console.log('⏰ SocketStore: Última mensagem enviada em:', now.toISOString());
    set({ lastMessageTime: now });
  },
  
  // ===== ACTIONS - ERRORS DE CONEXÃO =====
  setError: (error) => {
    console.error('❌ SocketStore: Erro de conexão definido:', error);
    set({ error });
  },
  
  clearError: () => {
    console.log('🧹 SocketStore: Erro de conexão limpo');
    set({ error: null });
  },
  
  // ===== ACTIONS - PING/LATENCY =====
  updatePing: (latency) => {
    console.log(`📶 SocketStore: Latência atualizada: ${latency}ms`);
    set({ 
      lastPingTime: new Date(),
      latency
    });
  },
  
  // ===== ACTIONS - TYPING =====
  setTyping: (typing) => {
    const { typingTimeout } = get();
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    console.log(`⌨️ SocketStore: ${typing ? 'Iniciando' : 'Parando'} digitação`);
    set({ isTyping: typing });
    
    // Auto-stop typing after 3 seconds
    if (typing) {
      const timeout = setTimeout(() => {
        console.log('⌨️ SocketStore: Auto-stop digitação após timeout');
        set({ isTyping: false, typingTimeout: null });
      }, 3000);
      set({ typingTimeout: timeout });
    } else {
      set({ typingTimeout: null });
    }
  },
  
  // ===== ACTIONS - RESET =====
  resetSocketState: () => {
    const { typingTimeout } = get();
    
    // Clear any active timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    console.log('🔄 SocketStore: Reset completo do estado de conexão');
    set({
      isConnected: false,
      isConnecting: false,
      isAuthenticated: false,
      isReconnecting: false,
      connectionAttempts: 0,
      lastConnectionTime: null,
      currentUser: null,
      userRole: null,
      roomId: null,
      inRoom: false,
      roomUsers: [],
      rateLimitExceeded: false,
      rateLimitResetTime: null,
      lastMessageTime: null,
      error: null,
      lastPingTime: null,
      latency: 0,
      isTyping: false,
      typingTimeout: null,
    });
  },
  
  // ===== ACTIONS - UTILITIES =====
  canSendMessage: () => {
    const { isConnected, isAuthenticated, rateLimitExceeded, lastMessageTime } = get();
    
    // Verificações básicas de conexão
    if (!isConnected || !isAuthenticated || rateLimitExceeded) {
      return false;
    }
    
    // Rate limiting: no more than 1 message per 100ms
    if (lastMessageTime) {
      const timeDiff = Date.now() - lastMessageTime.getTime();
      if (timeDiff < 100) {
        console.log('⚠️ SocketStore: Rate limit ativo - aguarde 100ms entre mensagens');
        return false;
      }
    }
    
    return true;
  },
  
  getConnectionStatus: () => {
    const { isConnected, isConnecting, isReconnecting, isAuthenticated } = get();
    
    if (isReconnecting) return 'reconnecting';
    if (isConnecting) return 'connecting';
    if (isConnected && isAuthenticated) return 'connected';
    if (isConnected && !isAuthenticated) return 'authenticating';
    return 'disconnected';
  },
  
  getConnectionInfo: () => {
    const { 
      isConnected, 
      isAuthenticated, 
      currentUser, 
      roomId, 
      inRoom, 
      connectionAttempts, 
      lastConnectionTime,
      latency
    } = get();
    
    return {
      isConnected,
      isAuthenticated,
      user: currentUser,
      roomId,
      inRoom,
      connectionAttempts,
      lastConnectionTime,
      latency,
      status: get().getConnectionStatus()
    };
  }
});

export default createSocketActions; 