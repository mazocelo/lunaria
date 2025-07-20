import jwt from 'jsonwebtoken';

/**
 * Middleware de autenticação para WebSocket
 */
export class AuthMiddleware {
  constructor() {
    this.secretKey = process.env.JWT_SECRET || 'rpg_chat_game_secret_key';
  }

  /**
   * Middleware para autenticação de socket
   */
  authenticate(socket, next) {
    try {
      return next();
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;

      if (!token) {
        // Permitir conexão sem token (autenticação posterior)
        console.log(`🔓 Conexão sem token permitida: ${socket.id}`);
        socket.isAuthenticated = false;
        return next();
      }

      // Verificar token JWT
      const cleanToken = token.replace('Bearer ', '');
      const decoded = jwt.verify(cleanToken, this.secretKey);

      // Adicionar informações do usuário ao socket
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      socket.userRole = decoded.role || 'player';
      socket.isAuthenticated = true;

      console.log(`🔐 Socket autenticado: ${socket.username} (${socket.userId})`);
      next();

    } catch (error) {
      console.error('❌ Erro na autenticação do socket:', error.message);
      
      // Permitir conexão mas marcar como não autenticado
      socket.isAuthenticated = false;
      next();
    }
  }

  /**
   * Verificar se socket está autenticado
   */
  requireAuth(socket, callback) {
    if (!socket.isAuthenticated) {
      socket.emit('auth_required', {
        message: 'Autenticação necessária para esta ação'
      });
      return false;
    }
    return true;
  }

  /**
   * Verificar se usuário tem papel específico
   */
  requireRole(socket, requiredRole, callback) {
    if (!this.requireAuth(socket, callback)) {
      return false;
    }

    if (socket.userRole !== requiredRole && socket.userRole !== 'admin') {
      socket.emit('insufficient_permissions', {
        message: `Permissão insuficiente. Necessário: ${requiredRole}`
      });
      return false;
    }

    return true;
  }

  /**
   * Gerar token JWT para usuário
   */
  generateToken(userId, username, role = 'player') {
    return jwt.sign(
      { 
        userId, 
        username, 
        role,
        iat: Math.floor(Date.now() / 1000)
      },
      this.secretKey,
      { expiresIn: '24h' }
    );
  }

  /**
   * Verificar e renovar token
   */
  refreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.secretKey);
      
      // Gerar novo token com mesmos dados
      return this.generateToken(decoded.userId, decoded.username, decoded.role);
    } catch (error) {
      throw new Error('Token inválido para renovação');
    }
  }
}

// Instância singleton
export const authMiddleware = new AuthMiddleware(); 