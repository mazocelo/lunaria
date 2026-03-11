import express from 'express';
import rateLimit from 'express-rate-limit';
import controller from '../controllers/mestreCriador/mestreCriadorController.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

const interagirLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // 20 interações por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Muitas requisições ao Mestre Criador. Aguarde um momento.' },
});

/**
 * POST /api/mestre-criador/interagir
 * Interage com o Mestre Criador para o wizard de criação de personagem
 */
router.post('/interagir', interagirLimiter, asyncHandler(controller.interagir));

export default router;
