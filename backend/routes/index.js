import express from 'express';
import rateLimit from 'express-rate-limit';
import historiaRoutes from './historia.js';
import sessaoRoutes from './sessao.js';
import personagemRoutes from './personagem.js';
import racaRoutes from './raca.js';
import classeRoutes from './classe.js';
import vantagemRoutes from './vantagens.js';
import desvantagemRoutes from './desvantagens.js';
import authRoutes from './auth.js';
import usuarioRoutes from './usuarios.js';
import jogoRoutes from './jogo.js';
import conviteRoutes from './convites.js';
import novidadesRoutes from './novidades.js';
import temasRoutes from './temas.js';
import websocketRoutes from './websocket.js';
import mestreRoutes from './mestres.js';
import monstroRoutes from './monstro.js';
import equipamentoRoutes from './equipamento.js';
import catalogosRoutes from './catalogos.js';
import amizadeRoutes from './amizades.js';
import feedRoutes from './feed.js';
import imageRoutes from './imageRoutes.js';
import ttsRoutes from './tts.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import { flags } from '../config/featureFlags.js';

const router = express.Router();

// Rate limiter por usuário para endpoints de criação
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 30, // 30 criações por 15 min por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas requisições. Tente novamente em alguns minutos.' }
});

/* GET home page. */
router.get('/', async (req, res, next) => {
  res.json({
    success: true,
    message: 'Role Chat Game API',
    version: '1.0.0',
    endpoints: {
      historias: '/historias',
      sessoes: '/sessoes',
      personagens: '/personagens',
      racas: '/racas',
      classes: '/classes',
      vantagens: '/vantagens',
      desvantagens: '/desvantagens',
      auth: '/auth',
      usuarios: '/usuarios',
      jogo: '/jogo',
      convites: '/convites',
      novidades: '/novidades',
      temas: '/temas',
      mestres: '/mestres',
      monstros: '/monstros',
      equipamentos: '/equipamentos',
      catalogos: '/catalogos',
      amizades: '/amizades',
      feed: '/feed',
      websocket: '/websocket'
    }
  });
});

// Feature flags (publico, sem auth)
router.get('/features', (req, res) => {
  res.json({ success: true, data: flags });
});

// Rotas da API

// Rotas públicas (sem autenticação obrigatória)
router.use('/auth', authRoutes);
router.use('/racas',authenticateToken, racaRoutes);
router.use('/classes',authenticateToken, classeRoutes);
router.use('/vantagens',authenticateToken, vantagemRoutes);
router.use('/desvantagens',authenticateToken, desvantagemRoutes);
router.use('/temas',authenticateToken, temasRoutes);
router.use('/equipamentos', authenticateToken, equipamentoRoutes);
router.use('/catalogos', authenticateToken, catalogosRoutes);
router.use('/websocket',authenticateToken, websocketRoutes);

// Rotas que requerem autenticação obrigatória
router.use('/historias', authenticateToken, historiaRoutes);
router.use('/personagens', authenticateToken, personagemRoutes);
router.use('/usuarios', authenticateToken, usuarioRoutes);
router.use('/convites', authenticateToken, conviteRoutes);
router.use('/novidades', authenticateToken, novidadesRoutes);
router.use('/jogo', authenticateToken, jogoRoutes);
router.use('/mestres', authenticateToken, mestreRoutes);

// Geração de imagem
router.use('/image', authenticateToken, imageRoutes);

// Text-to-Speech
router.use('/tts', authenticateToken, ttsRoutes);

// Rotas sociais
router.use('/amizades', authenticateToken, amizadeRoutes);
router.use('/feed', authenticateToken, createLimiter, feedRoutes);

// Rotas de sessão
router.use('/sessoes', authenticateToken, sessaoRoutes);

// Rotas de monstro (auth aplicado individualmente em POST/PUT/DELETE)
router.use('/monstros', monstroRoutes);

export default router;
