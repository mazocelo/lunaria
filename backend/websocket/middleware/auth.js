import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticação para WebSocket
 * Requer token JWT valido — conexoes sem token sao rejeitadas
 */
export const authMiddleware = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token ||
                  socket.handshake.query?.token ||
                  socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      const error = new Error('Token de autenticacao requerido');
      error.code = 'AUTH_REQUIRED';
      return next(error);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.username = decoded.nome || decoded.username || `User_${decoded.userId}`;
    socket.email = decoded.email;
    socket.role = decoded.role || 'player';
    socket.isAuthenticated = true;

    next();
  } catch (error) {
    console.error('Erro na autenticacao WebSocket:', error.message);
    const authError = new Error('Token invalido ou expirado');
    authError.code = 'AUTH_FAILED';
    return next(authError);
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
