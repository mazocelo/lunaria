import express from 'express';
import historiaRoutes from './historia.js';
import sessaoRoutes from './sessao.js';
import personagemRoutes from './personagem.js';
import racaRoutes from './raca.js';
import classeRoutes from './classe.js';
import vantagemRoutes from './vantagens.js';

const router = express.Router();

/* GET home page. */
router.get('/', async (req, res, next) => {
  res.json({
    success: true,
    message: 'Role Chat Game API',
    version: '1.0.0',
    endpoints: {
      historias: '/api/historia',
      sessoes: '/api/sessao',
      personagens: '/api/personagens',
      racas: '/api/racas',
      classes: '/api/classes',
      vantagens: '/api/vantagens'
    }
  });
});

// Rotas da API
router.use('/api/historia', historiaRoutes);
router.use('/api/sessao', sessaoRoutes);
router.use('/api/personagens', personagemRoutes);
router.use('/api/racas', racaRoutes);
router.use('/api/classes', classeRoutes);
router.use('/api/vantagens', vantagemRoutes);

export default router;
