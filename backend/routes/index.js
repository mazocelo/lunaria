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
import rpgRoutes from './rpg.js';
import temasRoutes from './temas.js';
import websocketRoutes from './websocket.js';
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
      rpg: '/rpg',
      temas: '/temas',
      websocket: '/websocket'
    }
  });
});

// Rotas da API

// Rotas públicas (sem autenticação obrigatória)
router.use('/auth', authRoutes);
router.use('/racas', racaRoutes);
router.use('/classes', classeRoutes);
router.use('/vantagens', vantagemRoutes);
router.use('/desvantagens', desvantagemRoutes);
router.use('/rpg', rpgRoutes);
router.use('/temas', temasRoutes);
router.use('/websocket', websocketRoutes);

// Rotas que requerem autenticação obrigatória
router.use('/historias', authenticateToken, historiaRoutes);
router.use('/personagens', authenticateToken, personagemRoutes);
router.use('/usuarios', authenticateToken, usuarioRoutes);
router.use('/convites', authenticateToken, conviteRoutes);
router.use('/novidades', authenticateToken, novidadesRoutes);
router.use('/jogo', authenticateToken, jogoRoutes);

// Rotas de sessão (sem middleware global, aplicado individualmente)
router.use('/sessoes', sessaoRoutes);

export default router;
