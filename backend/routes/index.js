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
import analyticsRoutes from './analytics.js';
import billingRoutes from './billing.js';
import habilidadesMagiasRoutes from './habilidades-magias.js';
import mestreCriadorRoutes from './mestreCriador.js';
import adminMotorRoutes from './adminMotor.js';
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';
import db from '../Model/index.js';
import gerenciadorSessoes from '../redis/sessoes.js';
const router = express.Router();

// Health check (sem auth, usado pelo CI/CD)
router.get('/health', async (req, res) => {
  const checks = { api: 'ok', db: 'ok', redis: 'ok' };
  let httpStatus = 200;

  try {
    await Promise.race([
      db.prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
  } catch {
    checks.db = 'error';
    httpStatus = 503;
  }

  try {
    await gerenciadorSessoes.initialize();
    await Promise.race([
      gerenciadorSessoes.client.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
  } catch {
    checks.redis = 'error';
    httpStatus = 503;
  }

  res.status(httpStatus).json({
    status: httpStatus === 200 ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});

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
      habilidades: '/habilidades',
      'habilidades-magias': '/habilidades-magias',
      amizades: '/amizades',
      feed: '/feed',
      websocket: '/websocket',
      analytics: '/analytics'
    }
  });
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
router.use('/habilidades', authenticateToken, habilidadesMagiasRoutes);
router.use('/habilidades-magias', authenticateToken, habilidadesMagiasRoutes);
router.use('/websocket',authenticateToken, websocketRoutes);

// Rotas que requerem autenticação obrigatória
router.use('/historias', optionalAuth, historiaRoutes);
router.use('/personagens', authenticateToken, personagemRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/convites', authenticateToken, conviteRoutes);
router.use('/novidades', authenticateToken, novidadesRoutes);
router.use('/jogo', authenticateToken, jogoRoutes);
router.use('/mestres', authenticateToken, mestreRoutes);
router.use('/mestre-criador', authenticateToken, mestreCriadorRoutes);

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

// Analytics (auth aplicado internamente - superadmin only)
router.use('/analytics', analyticsRoutes);

// Billing
router.use('/billing', authenticateToken, billingRoutes);

// Admin Motor (auth aplicado internamente - superadmin only)
router.use('/admin/motor', adminMotorRoutes);

// Focus Elementais (3D&T)
router.get('/focus-elementais', async (req, res) => {
  try {
    const focus = await db.prisma.focus_elementais.findMany({ orderBy: { ordem: 'asc' } });
    res.json({ success: true, data: focus });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Erro ao buscar focus elementais' });
  }
});

export default router;
