import express from 'express';
import rateLimit from 'express-rate-limit';
import habilidadesController from '../controllers/habilidades/habilidadesController.js';
import { requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas requisições. Tente novamente em alguns minutos.' }
});

// GET /habilidades — listar com filtros e paginação
router.get('/', (req, res) => habilidadesController.listarHabilidades(req, res));

// GET /habilidades/estatisticas — stats por tipo/elemento/categoria/escola
router.get('/estatisticas', (req, res) => habilidadesController.obterEstatisticas(req, res));

// GET /habilidades/:id — detalhe de uma habilidade
router.get('/:id', (req, res) => habilidadesController.obterHabilidade(req, res));

// POST /habilidades — criar (superadmin only)
router.post('/', writeLimiter, requireSuperAdmin, (req, res) => habilidadesController.criarHabilidade(req, res));

// PUT /habilidades/:id — atualizar (superadmin only)
router.put('/:id', writeLimiter, requireSuperAdmin, (req, res) => habilidadesController.atualizarHabilidade(req, res));

// DELETE /habilidades/:id — deletar (superadmin only)
router.delete('/:id', writeLimiter, requireSuperAdmin, (req, res) => habilidadesController.deletarHabilidade(req, res));

export default router;
