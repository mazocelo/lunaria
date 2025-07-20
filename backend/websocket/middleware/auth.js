import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticação para WebSocket
 */
export const authMiddleware = (socket, next) => {
  try {
    // Extrair token da query string ou headers
    const token = socket.handshake.auth?.token || 
                  socket.handshake.query?.token ||
                  socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      // Permitir conexões sem autenticação para modo visitante
      socket.userId = null;
      socket.username = 'Visitante';
      socket.isAuthenticated = false;
      socket.role = 'guest';
      
      console.log(`🔓 Conexão não autenticada: ${socket.id}`);
      return next();
    }

    // Verificar token JWT (se você estiver usando JWT)
    if (process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username || decoded.name;
      socket.email = decoded.email;
      socket.role = decoded.role || 'player';
      socket.isAuthenticated = true;
      
      console.log(`🔐 Usuário autenticado: ${socket.username} (${socket.userId})`);
    } else {
      // Modo de desenvolvimento - aceitar qualquer token
      socket.userId = token;
      socket.username = `User_${token}`;
      socket.isAuthenticated = true;
      socket.role = 'player';
      
      console.log(`🔧 Modo dev - Usuário: ${socket.username}`);
    }

    next();
  } catch (error) {
    console.error('❌ Erro na autenticação WebSocket:', error);
    
    // Em caso de erro, permitir como visitante
    socket.userId = null;
    socket.username = 'Visitante';
    socket.isAuthenticated = false;
    socket.role = 'guest';
    
    next();
  }
};

/**
 * Middleware para verificar se o usuário tem permissão para determinada ação
 */
export const requireAuth = (socket, next) => {
  if (!socket.isAuthenticated) {
    const error = new Error('Autenticação necessária');
    error.code = 'AUTH_REQUIRED';
    return next(error);
  }
  next();
};

/**
 * Middleware para verificar se o usuário é GM
 */
export const requireGM = (socket, next) => {
  if (!socket.isAuthenticated) {
    const error = new Error('Autenticação necessária');
    error.code = 'AUTH_REQUIRED';
    return next(error);
  }

  if (socket.role !== 'gm' && socket.role !== 'admin') {
    const error = new Error('Permissões de GM necessárias');
    error.code = 'GM_REQUIRED';
    return next(error);
  }

  next();
};

export default authMiddleware; 