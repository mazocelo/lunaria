import express from 'express';
import rateLimit from 'express-rate-limit';
import habilidadesMagiasController from '../controllers/habilidades-magias/habilidadesMagiasController.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas requisições. Tente novamente em alguns minutos.' }
});

// GET /habilidades-magias — listar com filtros e paginação
router.get('/', (req, res) => habilidadesMagiasController.listarHabilidades(req, res));

// GET /habilidades-magias/estatisticas — stats por tipo/elemento/categoria/escola
router.get('/estatisticas', (req, res) => habilidadesMagiasController.obterEstatisticas(req, res));

// GET /habilidades-magias/slots — slots de magia por classe+nivel
router.get('/slots', (req, res) => habilidadesMagiasController.obterSlots(req, res));

// GET /habilidades-magias/disponiveis — magias disponiveis para classe+nivel
router.get('/disponiveis', (req, res) => habilidadesMagiasController.obterDisponiveis(req, res));

// GET /habilidades-magias/:id — detalhe de uma habilidade
router.get('/:id', (req, res) => habilidadesMagiasController.obterHabilidade(req, res));

// POST /habilidades-magias — criar (superadmin only)
router.post('/', writeLimiter, authenticateToken, requireSuperAdmin, (req, res) => habilidadesMagiasController.criarHabilidade(req, res));

// PUT /habilidades-magias/:id — atualizar (superadmin only)
router.put('/:id', writeLimiter, authenticateToken, requireSuperAdmin, (req, res) => habilidadesMagiasController.atualizarHabilidade(req, res));

// DELETE /habilidades-magias/:id — deletar (superadmin only)
router.delete('/:id', writeLimiter, authenticateToken, requireSuperAdmin, (req, res) => habilidadesMagiasController.deletarHabilidade(req, res));

export default router;
