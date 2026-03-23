import express from 'express';
import magiasTresDetController from '../controllers/magiasTresdet/magiasTresDetController.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', asyncHandler(magiasTresDetController.listarMagias));
router.get('/:id', asyncHandler(magiasTresDetController.obterMagia));
router.post('/', authenticateToken, requireSuperAdmin, asyncHandler(magiasTresDetController.criarMagia));
router.put('/:id', authenticateToken, requireSuperAdmin, asyncHandler(magiasTresDetController.atualizarMagia));
router.delete('/:id', authenticateToken, requireSuperAdmin, asyncHandler(magiasTresDetController.deletarMagia));

export default router;
