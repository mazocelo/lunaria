import express from 'express';
import historiaRoutes from './historia.js';
import sessaoRoutes from './sessao.js';

const router = express.Router();

/* GET home page. */
router.get('/', async (req, res, next) => {
  res.json({
    success: true,
    message: 'Role Chat Game API',
    version: '1.0.0',
    endpoints: {
      historias: '/api/historia',
      sessoes: '/api/sessao'
    }
  });
});

// Rotas da API
router.use('/api/historia', historiaRoutes);
router.use('/api/sessao', sessaoRoutes);

export default router;
