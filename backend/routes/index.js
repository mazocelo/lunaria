import express from 'express';
import historiaRoutes from './historia.js';
import sessaoRoutes from './sessao.js';
import personagemRoutes from './personagem.js';

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
      personagens: '/api/personagens'
    }
  });
});

// Rotas da API
router.use('/api/historia', historiaRoutes);
router.use('/api/sessao', sessaoRoutes);
router.use('/api/personagens', personagemRoutes);

export default router;
