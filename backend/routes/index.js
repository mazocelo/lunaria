import express from 'express';
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
import { authenticateToken, optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

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
      websocket: '/websocket'
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
router.use('/websocket',authenticateToken, websocketRoutes);

// Rotas que requerem autenticação obrigatória
router.use('/historias', authenticateToken, historiaRoutes);
router.use('/personagens', authenticateToken, personagemRoutes);
router.use('/usuarios', authenticateToken, usuarioRoutes);
router.use('/convites', authenticateToken, conviteRoutes);
router.use('/novidades', authenticateToken, novidadesRoutes);
router.use('/jogo', authenticateToken, jogoRoutes);
router.use('/mestres', authenticateToken, mestreRoutes);

// Rotas de sessão
router.use('/sessoes', authenticateToken, sessaoRoutes);

// Rotas de monstro (auth aplicado individualmente em POST/PUT/DELETE)
router.use('/monstros', monstroRoutes);

export default router;
