import jwt from 'jsonwebtoken';
import db from '../Model/index.js';

/**
 * Middleware de autenticação JWT para rotas HTTP
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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
 * Gerar token JWT
 */
export const generateToken = (userId, email, role = 'player') => {
  return jwt.sign(
    { 
      userId, 
      email, 
      role,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET || 'rpg_chat_game_secret_key',
    { expiresIn: '24h' }
  );
};

/**
 * Verificar e renovar token
 */
export const refreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rpg_chat_game_secret_key');
    
    // Gerar novo token com mesmos dados
    return generateToken(decoded.userId, decoded.email, decoded.role);
  } catch (error) {
    throw new Error('Token inválido para renovação');
  }
}; 