import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../Model/index.js';
import { redisClient } from '../redis/redis-config.js';
import logger from '../helpers/logger.js';
const log = logger.child({ module: 'authMiddleware' });

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se usuário ainda existe
    const usuario = await db.Usuario.findById(decoded.userId);
    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Adicionar informações do usuário à requisição
    // Usar role do banco de dados (fonte de verdade), não do token
    req.user = {
      id: decoded.userId,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role || decoded.role || 'player'
    };

    next();
  } catch (error) {
    log.error({ err: error }, 'Erro na autenticacao');

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
    // Ler token do cookie (prioridade), igual ao authenticateToken
    let token = req.cookies?.accessToken;

    // Fallback: ler do header Authorization
    if (!token) {
      const authHeader = req.headers['authorization'];
      token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await db.Usuario.findById(decoded.userId);

    if (usuario) {
      req.user = {
        id: decoded.userId,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role || decoded.role || 'player'
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
export const generateAccessToken = (userId, email, nome, role = 'player') => {
  return jwt.sign(
    {
      userId,
      email,
      nome,
      role,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Token de acesso com 15 minutos
  );
};

/**
 * Gerar refresh token JWT (longa duração)
 */
export const generateRefreshToken = (userId, email, nome, role = 'player', rememberMe = false) => {
  const expiresIn = rememberMe ? '30d' : '25m'; // 30 dias se "lembrar de mim", senão 25 minutos

  return jwt.sign(
    {
      userId,
      email,
      nome,
      role,
      type: 'refresh',
      rememberMe,
      jti: crypto.randomUUID(),
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn }
  );
};

/**
 * Gerar token JWT (compatibilidade com código existente)
 */
export const generateToken = (userId, email, nome, role = 'player') => {
  return generateAccessToken(userId, email, nome, role);
};

/**
 * Gerar socket token JWT (longa duração para WebSocket)
 * Este token é usado exclusivamente para autenticação do Socket.IO
 */
export const generateSocketToken = (userId, email, nome, role = 'player') => {
  return jwt.sign(
    {
      userId,
      email,
      nome,
      role,
      type: 'socket',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' } // Token do socket com 24 horas
  );
};

/**
 * Verificar e renovar access token usando refresh token
 */
export const refreshToken = async (refreshTokenValue) => {
  try {
    const decoded = jwt.verify(
      refreshTokenValue,
      process.env.JWT_REFRESH_SECRET
    );

    // Verificar se é um refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Token deve ser um refresh token');
    }

    // Verificar blacklist (jti pode nao existir em tokens antigos)
    if (decoded.jti) {
      try {
        const blacklisted = await redisClient.get(`blacklist:${decoded.jti}`);
        if (blacklisted) {
          throw new Error('Token revogado');
        }
      } catch (redisErr) {
        if (redisErr.message === 'Token revogado') throw redisErr;
        log.error({ err: redisErr }, 'Redis indisponivel para blacklist check — rejeitando refresh por seguranca');
        throw new Error('Serviço temporariamente indisponível para validação de token');
      }
    }

    // Gerar novos tokens (preservar rememberMe da sessao original)
    const rm = decoded.rememberMe || false;
    const accessToken = generateAccessToken(decoded.userId, decoded.email, decoded.nome, decoded.role);
    const newRefreshToken = generateRefreshToken(decoded.userId, decoded.email, decoded.nome, decoded.role, rm);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      rememberMe: rm
    };
  } catch (error) {
    throw new Error(error.message || 'Refresh token inválido ou expirado');
  }
};

/**
 * Adicionar refresh token à blacklist no Redis
 * TTL = tempo restante até expiração do token
 */
export const blacklistRefreshToken = async (refreshTokenValue) => {
  try {
    const decoded = jwt.verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET, { ignoreExpiration: true });
    if (!decoded.jti) return; // Tokens antigos sem jti — ignorar

    const ttl = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0;
    if (ttl <= 0) return; // Já expirado

    await redisClient.set(`blacklist:${decoded.jti}`, '1', { EX: ttl });
    log.info({ jti: decoded.jti, ttl }, 'Refresh token adicionado à blacklist');
  } catch (err) {
    log.warn({ err }, 'Falha ao blacklistar refresh token');
  }
};

/**
 * Verificar refresh token
 */
export const verifyRefreshToken = (refreshTokenValue) => {
  try {
    const decoded = jwt.verify(
      refreshTokenValue, 
      process.env.JWT_REFRESH_SECRET
    );
    
    if (decoded.type !== 'refresh') {
      throw new Error('Token deve ser um refresh token');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Refresh token inválido ou expirado');
  }
};

/**
 * Middleware para verificar se usuário é superadmin
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Autenticação requerida'
    });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: 'Acesso negado. Apenas super administradores.'
    });
  }

  next();
};

/**
 * Middleware para verificar se usuário é dono do recurso ou superadmin
 * @param {string} paramName - Nome do parâmetro que contém o ID do usuário
 */
export const requireOwnerOrSuperAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação requerida'
      });
    }

    // SuperAdmin passa sempre
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Verificar se é o dono do recurso
    const resourceId = parseInt(req.params[paramName]);
    const userId = parseInt(req.user.id);

    if (isNaN(resourceId) || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido'
      });
    }

    if (resourceId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Você só pode acessar seus próprios recursos.'
      });
    }

    next();
  };
};

/**
 * Middleware para verificar ownership de recursos indiretos (historias, personagens, etc)
 */
export const requireResourceOwnerOrSuperAdmin = (modelName) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticação requerida'
      });
    }

    // SuperAdmin passa sempre
    if (req.user.role === 'superadmin') {
      return next();
    }

    try {
      const resourceId = parseInt(req.params.id);
      const userId = parseInt(req.user.id);

      if (isNaN(resourceId) || isNaN(userId)) {
        return res.status(400).json({ success: false, error: 'ID inválido' });
      }

      // Buscar recurso e verificar id_usuario
      const resource = await db[modelName].findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Recurso não encontrado'
        });
      }

      if (resource.id_usuario !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado. Você não é o dono deste recurso.'
        });
      }

      // Anexar recurso ao req para evitar busca duplicada
      req.resource = resource;
      next();
    } catch (error) {
      log.error({ err: error }, 'Erro ao verificar ownership');
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  };
}; 