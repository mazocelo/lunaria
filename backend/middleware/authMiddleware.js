import jwt from 'jsonwebtoken';
import db from '../Model/index.js';

/**
 * Middleware de autenticação JWT para rotas HTTP
 * Lê o JWT do cookie HttpOnly
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Ler token do cookie (prioridade)
    let token = req.cookies?.accessToken;
    
    // Fallback temporário: ler do header Authorization (compatibilidade)
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso requerido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rpg_chat_game_secret_key');
    
    // Verificar se usuário ainda existe
    const usuario = await db.Usuario.findById(decoded.userId);
    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Adicionar informações do usuário à requisição
    req.user = {
      id: decoded.userId,
      nome: usuario.nome,
      email: usuario.email,
      role: decoded.role || 'player'
    };

    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * Middleware opcional de autenticação - não falha se não houver token
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rpg_chat_game_secret_key');
    const usuario = await db.Usuario.findById(decoded.userId);
    
    if (usuario) {
      req.user = {
        id: decoded.userId,
        nome: usuario.nome,
        email: usuario.email,
        role: decoded.role || 'player'
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // Em caso de erro, continuar sem autenticação
    req.user = null;
    next();
  }
};

/**
 * Gerar token de acesso JWT (curta duração)
 */
export const generateAccessToken = (userId, email, role = 'player') => {
  return jwt.sign(
    { 
      userId, 
      email, 
      role,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET || 'rpg_chat_game_secret_key',
    { expiresIn: '15m' } // Token de acesso com 15 minutos
  );
};

/**
 * Gerar refresh token JWT (longa duração)
 */
export const generateRefreshToken = (userId, email, role = 'player', rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : '25m'; // 30 dias se "lembrar de mim", senão 25 minutos
  
  return jwt.sign(
    { 
      userId, 
      email, 
      role,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_REFRESH_SECRET || 'rpg_chat_game_refresh_secret_key',
    { expiresIn }
  );
};

/**
 * Gerar token JWT (compatibilidade com código existente)
 */
export const generateToken = (userId, email, role = 'player') => {
  return generateAccessToken(userId, email, role);
};

/**
 * Gerar socket token JWT (longa duração para WebSocket)
 * Este token é usado exclusivamente para autenticação do Socket.IO
 */
export const generateSocketToken = (userId, email, role = 'player') => {
  return jwt.sign(
    { 
      userId, 
      email, 
      role,
      type: 'socket',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET || 'rpg_chat_game_secret_key',
    { expiresIn: '24h' } // Token do socket com 24 horas
  );
};

/**
 * Verificar e renovar access token usando refresh token
 */
export const refreshToken = (refreshTokenValue) => {
  try {
    const decoded = jwt.verify(
      refreshTokenValue, 
      process.env.JWT_REFRESH_SECRET || 'rpg_chat_game_refresh_secret_key'
    );
    
    // Verificar se é um refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Token deve ser um refresh token');
    }
    
    // Gerar novos tokens
    const accessToken = generateAccessToken(decoded.userId, decoded.email, decoded.role);
    const newRefreshToken = generateRefreshToken(decoded.userId, decoded.email, decoded.role, false);
    
    return {
      accessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    throw new Error('Refresh token inválido ou expirado');
  }
};

/**
 * Verificar refresh token
 */
export const verifyRefreshToken = (refreshTokenValue) => {
  try {
    const decoded = jwt.verify(
      refreshTokenValue, 
      process.env.JWT_REFRESH_SECRET || 'rpg_chat_game_refresh_secret_key'
    );
    
    if (decoded.type !== 'refresh') {
      throw new Error('Token deve ser um refresh token');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Refresh token inválido ou expirado');
  }
}; 