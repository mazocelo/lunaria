import bcrypt from 'bcryptjs';
import db from '../../Model/index.js';
import { generateToken, refreshToken as renewToken } from '../../middleware/authMiddleware.js';

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

      // Gerar token JWT
      const token = generateToken(novoUsuario.id, novoUsuario.email);

      console.log('✅ Usuário registrado com sucesso:', novoUsuario.id);

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: {
          token,
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

      const { email, senha } = req.body;

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

      // Gerar token JWT
      const token = generateToken(usuario.id, usuario.email);

      console.log('✅ Login realizado com sucesso:', usuario.id);

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          token,
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
   * Renovar token
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async renovarToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token é obrigatório'
        });
      }

      const novoToken = renewToken(token);

      res.status(200).json({
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          token: novoToken
        }
      });

    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      res.status(401).json({
        success: false,
        error: 'Token inválido para renovação'
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