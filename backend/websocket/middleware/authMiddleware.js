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
      // Extrair token da query string, auth ou headers (compatível com auth.js)
      const token = socket.handshake.auth?.token || 
                    socket.handshake.query?.token ||
                    socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        // Permitir conexão sem token para modo visitante (compatível com auth.js)
        socket.userId = null;
        socket.username = 'Visitante';
        socket.isAuthenticated = false;
        socket.role = 'guest';
        socket.userRole = 'guest';
        
        console.log(`🔓 Conexão sem token permitida: ${socket.id}`);
        return next();
      }

      // Verificar token JWT
      const cleanToken = token.replace('Bearer ', '');
      const decoded = jwt.verify(cleanToken, this.secretKey);

      // Adicionar informações do usuário ao socket (compatível com HTTP JWT)
      socket.userId = decoded.userId; // Já correto
      socket.username = decoded.nome || decoded.username || `User_${decoded.userId}`; // Usar nome do token HTTP
      socket.email = decoded.email;
      socket.role = decoded.role || 'player'; // Compatibilidade com auth.js
      socket.userRole = decoded.role || 'player'; // Manter para compatibilidade existente
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
   * Gerar token JWT para usuário (compatível com HTTP JWT)
   */
  generateToken(userId, email, role = 'player') {
    return jwt.sign(
      { 
        userId, 
        email, 
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
      
      // Gerar novo token com mesmos dados (compatível com HTTP JWT)
      return this.generateToken(decoded.userId, decoded.email, decoded.role);
    } catch (error) {
      throw new Error('Token inválido para renovação');
    }
  }
}

// Instância singleton
export const authMiddleware = new AuthMiddleware(); 