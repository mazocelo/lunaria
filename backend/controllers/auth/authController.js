import bcrypt from 'bcryptjs';
import db from '../../Model/index.js';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  refreshToken as renewToken,
  verifyRefreshToken 
} from '../../middleware/authMiddleware.js';

/**
 * Controller para autenticação de usuários
 */
class AuthController {
  
  /**
   * Registrar novo usuário
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async registrar(req, res) {
    try {
      console.log('👤 Registrando novo usuário:', req.body.email);

      const { nome, email, senha } = req.body;

      // Validações básicas
      if (!nome || !email || !senha) {
        return res.status(400).json({
          success: false,
          error: 'Nome, email e senha são obrigatórios'
        });
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Formato de email inválido'
        });
      }

      // Validar senha (mínimo 6 caracteres)
      if (senha.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Senha deve ter no mínimo 6 caracteres'
        });
      }

      // Verificar se email já existe
      const emailExiste = await db.Usuario.emailExists(email);
      if (emailExiste) {
        return res.status(400).json({
          success: false,
          error: 'Este email já está cadastrado'
        });
      }

      // Criptografar senha
      const saltRounds = 12;
      const senhaHash = await bcrypt.hash(senha, saltRounds);

      // Criar usuário
      const novoUsuario = await db.Usuario.create({
        nome: nome.trim(),
        email: email.toLowerCase().trim(),
        senha: senhaHash
      });

      // Gerar tokens JWT
      const accessToken = generateAccessToken(novoUsuario.id, novoUsuario.email);
      const refreshToken = generateRefreshToken(novoUsuario.id, novoUsuario.email);

      console.log('✅ Usuário registrado com sucesso:', novoUsuario.id);

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          accessToken,
          refreshToken,
          usuario: {
            id: novoUsuario.id,
            nome: novoUsuario.nome,
            email: novoUsuario.email
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao registrar usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Login de usuário
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async login(req, res) {
    try {
      console.log('🔐 Tentativa de login:', req.body.email);

      const { email, senha, lembrarDeMim = false } = req.body;

      // Validações básicas
      if (!email || !senha) {
        return res.status(400).json({
          success: false,
          error: 'Email e senha são obrigatórios'
        });
      }

      // Buscar usuário por email
      const usuario = await db.Usuario.findByEmail(email.toLowerCase().trim());
      if (!usuario) {
        return res.status(401).json({
          success: false,
          error: 'Email ou senha incorretos'
        });
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({
          success: false,
          error: 'Email ou senha incorretos'
        });
      }

      // Gerar tokens JWT
      const accessToken = generateAccessToken(usuario.id, usuario.email);
      const refreshToken = generateRefreshToken(usuario.id, usuario.email, 'player', lembrarDeMim);

      console.log('✅ Login realizado com sucesso:', usuario.id, lembrarDeMim ? '(lembrar de mim ativado)' : '');

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          accessToken,
          refreshToken,
          lembrarDeMim,
          usuario: {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro no login:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Verificar token atual
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async verificarToken(req, res) {
    try {
      // Se chegou até aqui, o token é válido (middleware authenticateToken)
      res.status(200).json({
        success: true,
        message: 'Token válido',
        data: {
          usuario: req.user
        }
      });

    } catch (error) {
      console.error('❌ Erro ao verificar token:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Renovar tokens usando refresh token
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async renovarToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token é obrigatório'
        });
      }

      // Verificar se o usuário ainda existe
      const decoded = verifyRefreshToken(refreshToken);
      const usuario = await db.Usuario.findById(decoded.userId);
      
      if (!usuario) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      const novosTokens = renewToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Tokens renovados com sucesso',
        data: {
          accessToken: novosTokens.accessToken,
          refreshToken: novosTokens.refreshToken
        }
      });

    } catch (error) {
      console.error('❌ Erro ao renovar tokens:', error);
      res.status(401).json({
        success: false,
        error: 'Refresh token inválido ou expirado'
      });
    }
  }

  /**
   * Logout (invalidar token no lado cliente)
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async logout(req, res) {
    try {
      // No JWT stateless, o logout é feito no lado cliente
      // Aqui poderíamos implementar uma blacklist de tokens se necessário
      
      console.log('👋 Logout realizado:', req.user?.email);

      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro no logout:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}

export default new AuthController(); 